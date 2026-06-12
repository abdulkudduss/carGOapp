# @cargo/api

The typed API client shared by all three CARGO apps (`web-ops`, `pvz`, `mobile`).
**Transport + generated types + typed errors only** — no React, no TanStack
Query, no zod, no DOM/`localStorage`/`document`, no per-endpoint business logic.
TanStack Query and zod live in the apps; claim/issuance flows arrive in later
steps. The package is consumed as TS source (`exports["."] → ./src/index.ts`) by
both Vite (web) and Metro (React Native).

## What's in here

- **`ApiClient`** — a hand-written `fetch` wrapper: Bearer-header injection,
  401 single-flight refresh + retry, `Idempotency-Key` on idempotent mutations.
- **`TokenStore`** — an injectable token-storage interface (the package never
  touches `localStorage`/SecureStore itself) + a `MemoryTokenStore`.
- **`ApiError` / `ApiErrorData`** — a discriminated union of business error codes
  (`409`/`422`) keyed on the machine **code**, not the HTTP status.
- **`uuidv4`** — cross-platform UUID v4 for idempotency keys.
- **`src/generated/schema.ts`** — types generated from the backend's OpenAPI doc
  (committed; see below).

## Generated types

```sh
pnpm --filter @cargo/api gen:types    # → src/generated/schema.ts
```

`gen:types` runs `openapi-typescript` against the **live local backend** and
writes `src/generated/schema.ts`. Override the source with `OPENAPI_URL`:

```sh
OPENAPI_URL=http://localhost:8080/api-docs pnpm --filter @cargo/api gen:types
```

- **OpenAPI JSON path:** `http://localhost:8080/api-docs`. (springdoc's default
  `/v3/api-docs` is behind auth on this backend and returns `401`; the project
  remaps the public doc to `/api-docs` — see `springdoc.api-docs.path` in the
  backend `application.yml`.)
- The generated file is **committed** (like `@cargo/tokens`' `dist/`), excluded
  from lint via the `**/generated/**` ignore, so every app typechecks and builds
  with no live backend. Regenerate and commit after the backend adds endpoints.
- Today the doc covers `identity` (`auth`, `/me`) plus stubs of the parcel /
  issuance / warehouse modules. Responses are mostly typed only as `200 OK`
  (springdoc didn't attach response schemas), so `request<T>()` takes an explicit
  `T`; tighten call sites as the backend annotates responses.

## Auth mode: Bearer header

The backend currently authenticates via `Authorization: Bearer <access>`
(security scheme `bearerAuth`, verified against live responses) — **not** cookies.
The client reflects this: `credentials` defaults to `'omit'`. If the backend
switches to httpOnly cookies, set `credentials: 'include'` in `ApiClientOptions`
and have the `TokenStore` return `null` for access (the cookie travels itself) —
no other change needed.

## Usage

```ts
import { ApiClient, MemoryTokenStore } from '@cargo/api';

const client = new ApiClient({
  baseUrl: 'http://localhost:8080',
  tokenStore: myTokenStore,            // see "Token storage" below
  onAuthFailure: () => router.replace('/login'),
});

const me = await client.get<MeResponse>('/api/v1/me');
await client.post('/api/v1/parcels/123/claim', undefined, { idempotent: true });
```

### Token storage (injected)

The package does **not** decide where tokens live. Provide a `TokenStore`:

```ts
interface TokenStore {
  getAccess(): Awaitable<string | null>;
  getRefresh(): Awaitable<string | null>;
  setTokens(t: { accessToken: string; refreshToken: string }): Awaitable<void>;
  clear(): Awaitable<void>;
}
```

Every method may be sync or async, so a synchronous in-memory web store and an
async Expo `SecureStore` store both satisfy it. Web passes memory + secure
storage; RN passes SecureStore/AsyncStorage. `MemoryTokenStore` is provided for
the smoke and as the volatile half of a web store (not persistent on its own).

### Single-flight refresh on 401

When a request gets `401`, the client refreshes **once**: the first `401` starts
`POST /api/v1/auth/refresh`; any other `401` that lands while it is in flight
awaits the **same** promise (deduplicated via one in-flight `Promise`). On
success both tokens are persisted (refresh returns a fresh pair; storing the new
refresh token keeps the client correct even if the backend later rotates them)
and every waiting request retries once. If there is no refresh token, or the refresh
fails, or the retry still `401`s, tokens are cleared and the injected
`onAuthFailure` fires — the app owns logout/navigation, the package does not.

### Idempotency-Key

Pass `{ idempotent: true }` to add an `Idempotency-Key` header (TZ §8.3). The
UUID is generated **once per call** and reused on the refresh-retry, so a retried
mutation is deduplicated server-side, never double-applied. `uuidv4()` works in
browsers, RN/Hermes and Node via a three-tier strategy
(`crypto.randomUUID` → `crypto.getRandomValues` → `Math.random` fallback) — no
dependency, no required polyfill. An idempotency key needs uniqueness, not
cryptographic unpredictability, so the `Math.random` fallback is acceptable where
no crypto source exists (Hermes without a polyfill).

## Typed errors

`409`/`422` business responses are not system failures — each carries a machine
**code** in `ApiResponse.code`. `request()` throws an `ApiError` whose `.data` is
a discriminated union keyed on that code (never on the HTTP status):

```ts
try {
  await client.post(`/api/v1/parcels/${id}/claim`, undefined, { idempotent: true });
} catch (e) {
  if (isApiError(e) && e.data.known) {
    switch (e.data.code) {
      case 'ALREADY_CLAIMED': /* offer "dispute" */ break;
      case 'CONFIRMATION_REQUIRED': /* back to confirmation step */ break;
      case 'VALIDATION_ERROR': showFieldErrors(e.data.fields); break;
      // …
    }
  } else {
    // e.data.known === false → unknown server code or network error: generic toast
  }
}
```

Recognized codes (`KNOWN_ERROR_CODES`), seeded from the TZ and verified against
the backend `ErrorCode` enum: `ALREADY_CLAIMED`, `ALREADY_DISPUTED`,
`CANNOT_DISPUTE`, `CONFIRMATION_REQUIRED`, `INVALID_STATUS`, plus
`VALIDATION_ERROR` (which carries `fields: { field, message }[]`). Any other code
maps to a safe `kind: 'unknown'` member, and transport failures to
`kind: 'network'` — neither crashes the caller. The UI maps code → message; the
package only guarantees a type-safe parse.

## Integration smoke

```sh
pnpm --filter @cargo/api smoke        # needs the local backend + Postgres up
```

Runs the full cycle against the live backend: `otp/request` → read the dev OTP →
`otp/verify` → `GET /me` → corrupt the access token → fire 5 concurrent requests
→ assert exactly one single-flight refresh → all retried OK → dead-refresh →
`onAuthFailure`. It is **not** part of typecheck/build/lint (those run without a
backend).

**Dev OTP mechanism:** the backend sends no SMS in dev — `OutboxDispatcher` is a
stub and `NikitaSmsAdapter` is never invoked. The plaintext code lands only in
the `notifications` outbox row (payload `{"code":"…"}`, template `OTP`). The
smoke reads it from Postgres via `psql` (local dev creds, overridable with the
standard `PG*` env vars). `requestOtp` auto-creates a `CLIENT` for any unknown
phone, so no seeded user is needed. Override `SMOKE_BASE_URL` / `SMOKE_PHONE` as
needed.
