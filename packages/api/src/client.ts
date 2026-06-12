// Hand-written runtime client over `fetch`. Pure TypeScript — no React, no
// TanStack Query (those live in the apps), no DOM globals beyond the universal
// `fetch`/`Headers`/`AbortController` subset present in browsers, RN/Hermes and
// Node. Token storage and auth-failure handling are injected (see TokenStore).

import { ApiError, networkError, parseApiError } from './errors.ts';
import type { Awaitable, TokenPair, TokenStore } from './token-store.ts';
import { uuidv4 } from './uuid.ts';

/** Injectable `fetch`; defaults to `globalThis.fetch`. Lets the smoke instrument calls. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** The server's uniform response wrapper (`ApiResponse<T>`). */
export interface ApiEnvelope<T> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
}

export interface ApiClientOptions {
  /** Backend origin, e.g. `http://localhost:8080`. Trailing slash optional. */
  baseUrl: string;
  /** Injected token storage (memory / SecureStore / AsyncStorage). */
  tokenStore: TokenStore;
  /**
   * Called when authentication is unrecoverable (no refresh token, or refresh
   * failed). The app handles logout/navigation; the package does not. Tokens are
   * already cleared before this fires.
   */
  onAuthFailure?: () => Awaitable<void>;
  /** Override `fetch` (tests, smoke, custom agents). */
  fetch?: FetchLike;
  /**
   * `credentials` for every request. Defaults to `'omit'` (Bearer-header mode,
   * which is what the backend uses today). Set `'include'` if the backend
   * switches to httpOnly cookies — the rest of the client is unchanged.
   */
  credentials?: RequestCredentials;
  /** Static headers added to every request (e.g. `Accept-Language`). */
  defaultHeaders?: Record<string, string>;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: string;
  /** Query params; `null`/`undefined` values are skipped. */
  query?: Record<string, QueryValue>;
  /**
   * Request payload. A plain object/array is JSON-serialized; `FormData`/`Blob`/
   * `string` are passed through untouched (e.g. signature multipart upload).
   */
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Mark a mutation as idempotent → send an `Idempotency-Key` (TZ §8.3). The key
   * is generated ONCE per call and reused across the auth-refresh retry, so a
   * retried request is deduplicated server-side rather than double-applied.
   */
  idempotent?: boolean;
  /** Attach `Authorization: Bearer`. Default `true`; set `false` for public endpoints. */
  auth?: boolean;
  signal?: AbortSignal;
}

function isPlainJsonBody(body: unknown): boolean {
  if (body === undefined || body === null) return false;
  if (typeof body === 'string') return false;
  // FormData / Blob / ArrayBuffer / typed arrays are sent as-is.
  const ctor = (body as { constructor?: { name?: string } }).constructor?.name;
  if (ctor === 'FormData' || ctor === 'Blob' || ctor === 'ArrayBuffer') return false;
  if (ArrayBuffer.isView(body)) return false;
  return true;
}

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === null || v === undefined) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text; // non-JSON (unexpected for this API) — surfaced as raw
  }
}

function unwrap<T>(body: unknown): T {
  // Every JSON endpoint is enveloped; return `.data`. Bodiless/raw responses
  // pass through so binary/no-content endpoints don't choke.
  if (body !== null && typeof body === 'object' && 'success' in body) {
    return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStore: TokenStore;
  private readonly onAuthFailure?: () => Awaitable<void>;
  private readonly doFetch: FetchLike;
  private readonly credentials: RequestCredentials;
  private readonly defaultHeaders: Record<string, string>;

  /** Single-flight guard: concurrent 401s share ONE refresh (TZ §9). */
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenStore = options.tokenStore;
    this.onAuthFailure = options.onAuthFailure;
    const injected = options.fetch ?? (globalThis as { fetch?: FetchLike }).fetch;
    if (!injected) {
      throw new Error('ApiClient: no fetch available — pass options.fetch.');
    }
    this.doFetch = injected;
    this.credentials = options.credentials ?? 'omit';
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  /**
   * Perform a request and return the unwrapped `data`. Throws {@link ApiError}
   * for any non-2xx response (business code or transport failure).
   */
  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', query, body, headers, idempotent, auth = true, signal } = options;
    const url = `${this.baseUrl}${path}${buildQuery(query)}`;

    // Generated once; stable across the refresh-retry so the server dedupes it.
    const idempotencyKey = idempotent ? uuidv4() : undefined;
    const jsonBody = isPlainJsonBody(body);
    const serializedBody =
      body === undefined ? undefined : jsonBody ? JSON.stringify(body) : (body as BodyInit);

    const send = async (): Promise<Response> => {
      const h: Record<string, string> = { ...this.defaultHeaders, ...headers };
      if (jsonBody) h['Content-Type'] = 'application/json';
      if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey;
      if (auth) {
        const access = await this.tokenStore.getAccess();
        if (access) h['Authorization'] = `Bearer ${access}`;
      }
      return this.doFetch(url, {
        method,
        headers: h,
        body: serializedBody,
        credentials: this.credentials,
        signal,
      });
    };

    let res: Response;
    try {
      res = await send();
    } catch (cause) {
      throw new ApiError(networkError(cause));
    }

    // 401 → one single-flight refresh, then retry the original request once.
    if (res.status === 401 && auth) {
      const refreshed = await this.ensureRefresh();
      if (!refreshed) {
        await this.failAuth();
        throw new ApiError(parseApiError(res.status, await parseBody(res)));
      }
      try {
        res = await send();
      } catch (cause) {
        throw new ApiError(networkError(cause));
      }
      if (res.status === 401) {
        // Fresh token still rejected → unrecoverable.
        await this.failAuth();
        throw new ApiError(parseApiError(res.status, await parseBody(res)));
      }
    }

    const parsed = await parseBody(res);
    if (!res.ok) {
      throw new ApiError(parseApiError(res.status, parsed));
    }
    return unwrap<T>(parsed);
  }

  get<T = unknown>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T = unknown>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Coalesced token refresh. The first 401 starts the refresh; any 401 that
   * arrives while it is in flight awaits the same promise. Resolves `true` if a
   * new pair was stored, `false` otherwise (caller then triggers auth-failure).
   */
  private ensureRefresh(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.doRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = await this.tokenStore.getRefresh();
    if (!refreshToken) return false; // nothing to refresh with — fail fast
    let res: Response;
    try {
      res = await this.doFetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: this.credentials,
      });
    } catch {
      return false;
    }
    if (!res.ok) return false;
    const pair = unwrap<TokenPair | undefined>(await parseBody(res));
    if (!pair?.accessToken || !pair?.refreshToken) return false;
    // Persist BOTH — refresh issues a fresh pair; store the new refresh token
    // too so the client is forward-compatible if the backend starts rotating.
    await this.tokenStore.setTokens(pair);
    return true;
  }

  private async failAuth(): Promise<void> {
    await this.tokenStore.clear();
    if (this.onAuthFailure) await this.onAuthFailure();
  }
}
