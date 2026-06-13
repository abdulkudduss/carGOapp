# Mobile patterns — read this before adding a screen

The OTP-login flow (`PhoneScreen → CodeScreen → AuthedScreen`) is the **reference
implementation**. Every other client screen (address, parcels, claim, pre-alerts,
PVZ picker — TZ §6.2–6.7) is built by **copying these conventions**, not by
inventing new ones. This note is the map.

## State: zustand vs TanStack Query (the split — TZ §8)

| Kind of state | Tool | Where |
|---|---|---|
| **Server data** (anything the API owns) | **TanStack Query** | `src/api/hooks.ts` |
| **Client/session state** (is-authed, role, OTP step) | **zustand** | `src/store/session.ts` |

Rules:
- **All** server reads/writes go through a hook in `src/api/hooks.ts` — queries for
  reads (`useMe`), mutations for writes (`useRequestOtp`, `useVerifyOtp`). Screens
  never call `api.get/post` directly.
- Keep server responses in the query cache. Mirror into zustand **only** the few
  session-derived bits the navigator needs synchronously (`role`, `maskedRoom`).
  Do **not** copy whole responses into zustand — that creates two sources of truth.
- `QueryClientProvider` is mounted once in `App.tsx`; the client is `src/api/queryClient.ts`.

## Navigation & the auth gate

- `src/navigation/RootNavigator.tsx` is the **gate**. It reads only
  `session.status` from zustand and renders the auth stack or the authed tree —
  it never calls the network itself.
- Switching the tree on `status` **is** the navigation. To log a user out, reset
  the session (`useSessionStore.getState().reset()`); the gate re-renders the auth
  stack. No imperative `navigate()` for auth transitions.
- Typed routes: declare params in `src/navigation/types.ts`, consume via
  `AuthScreenProps<'Screen'>`. Server-owned values (e.g. the resend cooldown) are
  passed as route params, never recomputed downstream.

## Tokens (TZ §9)

- `src/api/tokenStore.ts` (`RnTokenStore`) implements `@cargo/api`'s `TokenStore`:
  **access in memory**, **refresh in `expo-secure-store`** (Keychain/Keystore).
  Access is deliberately never persisted; the refresh token restores the session
  on cold start.
- The single `ApiClient` is wired in `src/api/client.ts`. `onAuthFailure` clears
  the zustand session (→ gate shows PhoneScreen). **Navigation stays in the app** —
  `@cargo/api` never imports navigation. Single-flight refresh, 401-retry and
  `Idempotency-Key` live inside the client; you just supply the seams.

## i18n (TZ §8.6) — no string ever in JSX

- Every user-facing string goes through `t()` from `src/i18n`. RU is the source of
  truth (`src/i18n/ru.ts`); KG (`ky.ts`) is an empty structure that falls back to
  RU per key. Add new keys to `ru.ts`, namespaced by screen.
- Interpolation: `t('code.subtitle', { phone })`. Keys are typed — a typo is a
  compile error.

## Errors: map the CODE, not the HTTP status (TZ §8.2)

- `src/api/errorToMessage.ts` turns an `ApiError` into a localized string keyed on
  the **machine `code`** (`INVALID_OTP`, `NETWORK_ERROR`, `VALIDATION_ERROR`, …),
  never on `409`/`422`/`500`. Add a code → `errors.<CODE>` mapping + an `ru.errors`
  entry when a screen needs to react to a new business code.
- A code the shared `@cargo/api` package hasn't enumerated still arrives (as
  `kind:'unknown'`) with its `.code` intact — map on `.code`, not the union `kind`.
- Unmapped codes fall back to `errors.unknown`. Never a crash, never a raw status.

## Every screen handles loading + error (TZ §8.5)

See `AuthedScreen`: `useMe()` → `isPending` shows a `Skeleton`, `isError` shows an
inline message (`errorToMessage`) + a Retry button, success renders the data.
Mutations show a loader on the submit `Button` while `isPending` and render
`isError` inline. Copy this triad on every screen.

## Forms: react-hook-form + zod, bound with `Controller`

RN `TextInput` emits `onChangeText`, not a web `onChange` event — so bind fields
with `<Controller>` (see `PhoneScreen`/`CodeScreen`), **not** `register()`.
`register` compiles but silently captures nothing on RN.

## API config / addressing

Base URL is config, never hardcoded — `src/config/env.ts` resolves
`EXPO_PUBLIC_API_BASE_URL` → `app.json` `extra.apiBaseUrl` → platform fallback.
See `README.md` for emulator vs device addressing.

## UI

Components come from `src/ui` (the RN set on `@cargo/tokens`). Don't hardcode
colors/spacing/type — use the `role`/`space`/`type`/`radius` tokens from
`src/ui/theme.ts` so a future dark theme re-themes for free.
