// Token storage is an INJECTED dependency — the package never decides where
// tokens live. Web passes an in-memory + secure-storage implementation; React
// Native passes Expo SecureStore / AsyncStorage. The package stays free of
// `localStorage` / `document` so it runs unchanged in both runtimes (TZ §9).
//
// Every method may be sync OR async (`Awaitable`) so a synchronous web store and
// an async native store both satisfy the interface; the client always `await`s.

export type Awaitable<T> = T | Promise<T>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenStore {
  /** Current access token, or `null` if none. */
  getAccess(): Awaitable<string | null>;
  /** Current refresh token, or `null` if none. */
  getRefresh(): Awaitable<string | null>;
  /** Persist a freshly issued pair (login or refresh). Store BOTH — refresh rotates. */
  setTokens(tokens: TokenPair): Awaitable<void>;
  /** Drop all tokens (logout / refresh failure). */
  clear(): Awaitable<void>;
}

/**
 * Minimal in-memory {@link TokenStore}. Suitable for the integration smoke and
 * as the volatile half of a web store; NOT persistent — survives only the
 * current JS runtime. Do not use as the sole store in production apps.
 */
export class MemoryTokenStore implements TokenStore {
  private access: string | null;
  private refresh: string | null;

  constructor(initial?: Partial<TokenPair>) {
    this.access = initial?.accessToken ?? null;
    this.refresh = initial?.refreshToken ?? null;
  }

  getAccess(): string | null {
    return this.access;
  }

  getRefresh(): string | null {
    return this.refresh;
  }

  setTokens(tokens: TokenPair): void {
    this.access = tokens.accessToken;
    this.refresh = tokens.refreshToken;
  }

  clear(): void {
    this.access = null;
    this.refresh = null;
  }
}
