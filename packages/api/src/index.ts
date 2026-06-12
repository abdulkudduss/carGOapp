// @cargo/api — typed API client shared by web-ops, pvz and mobile.
// Transport + generated types + typed errors only. No React, no TanStack Query,
// no zod, no endpoint/business logic (those live in the apps).

export { ApiClient } from './client.ts';
export type {
  ApiClientOptions,
  ApiEnvelope,
  FetchLike,
  QueryValue,
  RequestOptions,
} from './client.ts';

export { MemoryTokenStore } from './token-store.ts';
export type { Awaitable, TokenPair, TokenStore } from './token-store.ts';

export {
  ApiError,
  isApiError,
  KNOWN_ERROR_CODES,
  networkError,
  parseApiError,
} from './errors.ts';
export type { ApiErrorData, ApiValidationField, KnownErrorCode } from './errors.ts';

export { uuidv4 } from './uuid.ts';

// Generated OpenAPI types (committed artifact; regenerate with `pnpm --filter
// @cargo/api gen:types`). `export type *` keeps this type-only under
// `isolatedModules`.
export type * as schema from './generated/schema.ts';
