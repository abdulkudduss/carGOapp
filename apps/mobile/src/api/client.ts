// The app's single ApiClient instance, wired for React Native.
//
// Composition happens HERE, in the app — @cargo/api stays runtime-agnostic:
//   • baseUrl       ← config (src/config/env.ts), never hardcoded.
//   • tokenStore    ← RnTokenStore (access in memory, refresh in SecureStore).
//   • onAuthFailure ← clears the zustand session so the auth gate flips back to
//                     the PhoneScreen. NAVIGATION STAYS IN THE APP: the client
//                     fires this callback, the app reacts by resetting session;
//                     the navigator re-renders the auth stack from `status`. The
//                     package never imports navigation (TZ §9).
//
// The single-flight refresh, 401-retry and Idempotency-Key live inside the
// client (see packages/api/src/client.ts) — the app just supplies these seams.

import { ApiClient } from '@cargo/api';
import { API_BASE_URL } from '../config/env';
import { useSessionStore } from '../store/session';
import { RnTokenStore } from './tokenStore';

export const tokenStore = new RnTokenStore();

export const api = new ApiClient({
  baseUrl: API_BASE_URL,
  tokenStore,
  // Tokens are already cleared by the client before this fires; we only need to
  // tear down session state. getState() avoids the React-hook rule (this is a
  // non-component module). The gate (RootNavigator) does the actual redirect.
  onAuthFailure: () => {
    useSessionStore.getState().reset();
  },
});
