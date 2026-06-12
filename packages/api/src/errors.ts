// Typed API errors.
//
// The backend wraps every response in `ApiResponse<T>`:
//   success:  { success: true,  data: T, message?: string }
//   error:    { success: false, code: string, message: string }              (AppException)
//   422 valid:{ success: false, code: 'VALIDATION_ERROR', message, data: [...] }
// (confirmed from the backend's ApiResponse + GlobalExceptionHandler).
//
// Business conflicts (`409`/`422`) are NOT system failures — they carry a
// machine `code` in the body (TZ §8.2). We discriminate the error on that
// **code**, never on the HTTP status. The UI later maps code → message/action.
//
// Unknown codes (endpoints/modules added later, or a typo) must never crash the
// caller: they fall through to a safe `kind: 'unknown'` member of the union.

/**
 * Business error codes seeded from the TZ (§6.4, §7.2) and verified against the
 * backend `ErrorCode` enum. Re-run after the backend adds modules and extend if
 * the UI needs to react to more of them.
 */
export const KNOWN_ERROR_CODES = [
  'ALREADY_CLAIMED', // 409 — claim: parcel already claimed by another client
  'ALREADY_DISPUTED', // 409 — dispute: this client already disputed it
  'CANNOT_DISPUTE', // 422 — dispute: parcel is own/UNCLAIMED, dispute meaningless
  'CONFIRMATION_REQUIRED', // 409 — issuance complete: OTP-confirmed OR (skip + signature) not met
  'INVALID_STATUS', // 409 — issuance complete: parcel was issued in a parallel issuance
] as const;

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

/** One field error from a `422 VALIDATION_ERROR` body (`data: [{field,message}]`). */
export interface ApiValidationField {
  field: string;
  message: string;
}

interface ErrorBase {
  /** HTTP status (0 for transport/parse failures that never reached a response). */
  httpStatus: number;
  /** Human-readable message from the body, or a synthetic one. Not for display logic. */
  message: string;
  /** The raw parsed body (or `undefined`), for logging/diagnostics. */
  raw: unknown;
}

/**
 * Discriminated union of everything `request()` can throw, keyed on `code`.
 *
 * - `known: true`  → `code` narrows to a literal the client recognizes; safe to
 *   drive an exhaustive code→message map.
 * - `known: false` → `kind` is `'unknown'` (server code we don't model) or
 *   `'network'` (request never produced a parseable response); show a generic
 *   fallback, do not assume `code` is meaningful.
 */
export type ApiErrorData =
  | (ErrorBase & { kind: 'business'; known: true; code: KnownErrorCode })
  | (ErrorBase & {
      kind: 'validation';
      known: true;
      code: 'VALIDATION_ERROR';
      fields: ApiValidationField[];
    })
  | (ErrorBase & { kind: 'unknown'; known: false; code: string })
  | (ErrorBase & { kind: 'network'; known: false; code: 'NETWORK_ERROR' });

/** Thrown by the client for any non-2xx response or transport failure. */
export class ApiError extends Error {
  readonly data: ApiErrorData;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.name = 'ApiError';
    this.data = data;
    // Restore the prototype chain for `instanceof` across transpile targets.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** The machine code (`ALREADY_CLAIMED`, `NETWORK_ERROR`, …). */
  get code(): string {
    return this.data.code;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseValidationFields(data: unknown): ApiValidationField[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item): ApiValidationField[] => {
    if (!isRecord(item)) return [];
    const field = typeof item.field === 'string' ? item.field : '';
    const message = typeof item.message === 'string' ? item.message : '';
    return [{ field, message }];
  });
}

function isKnownCode(code: string): code is KnownErrorCode {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code);
}

/**
 * Build an {@link ApiErrorData} from an HTTP status and a parsed error body.
 * Falls back to `kind: 'unknown'` for any code not in {@link KNOWN_ERROR_CODES}
 * and for bodies missing a usable `code` — never throws.
 */
export function parseApiError(httpStatus: number, body: unknown): ApiErrorData {
  const code = isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
  const message =
    (isRecord(body) && typeof body.message === 'string' && body.message) ||
    `HTTP ${httpStatus}`;

  if (code === 'VALIDATION_ERROR') {
    return {
      kind: 'validation',
      known: true,
      code: 'VALIDATION_ERROR',
      fields: parseValidationFields(isRecord(body) ? body.data : undefined),
      httpStatus,
      message,
      raw: body,
    };
  }

  if (code !== undefined && isKnownCode(code)) {
    return { kind: 'business', known: true, code, httpStatus, message, raw: body };
  }

  return {
    kind: 'unknown',
    known: false,
    code: code ?? 'UNKNOWN',
    httpStatus,
    message,
    raw: body,
  };
}

/** Build an {@link ApiErrorData} for a transport failure (fetch threw, body unreadable). */
export function networkError(cause: unknown): ApiErrorData {
  const message = cause instanceof Error ? cause.message : 'Network request failed';
  return { kind: 'network', known: false, code: 'NETWORK_ERROR', httpStatus: 0, message, raw: cause };
}
