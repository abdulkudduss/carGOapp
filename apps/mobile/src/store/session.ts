// Session / client-side state — zustand (TZ §8 split, the convention for this app):
//
//   zustand        → client & session state: is the user authed, what role/context
//                    did /me return, where are we in the OTP flow. Synchronous,
//                    ephemeral, app-owned. THIS FILE.
//   TanStack Query → ALL server data (otp/request, otp/verify, /me). Never mirror
//                    a full server response into zustand — keep only the
//                    session-derived bits (isAuthenticated, role, maskedRoom) the
//                    navigator/gate needs synchronously. See src/api/hooks.ts.
//
// The auth gate (RootNavigator) reads `status` from here and nothing else — it
// never touches the network directly.

import { create } from 'zustand';

export type SessionStatus =
  | 'bootstrapping' // app just launched, still checking SecureStore for a refresh token
  | 'authenticated' // a session exists (refresh token present / just logged in)
  | 'unauthenticated'; // show the auth stack

interface SessionState {
  status: SessionStatus;
  // Context from GET /me, mirrored for synchronous reads (the canonical copy
  // lives in the /me query cache). `null` until /me resolves.
  role: string | null;
  maskedRoom: string | null;

  /** Cold-start gate decided we have (bootstrap=true) or lack a restorable session. */
  bootstrapResolved: (authed: boolean) => void;
  /** OTP verify succeeded and tokens are stored — flip the gate to the authed stack. */
  signedIn: () => void;
  /** Write the session-derived context from a successful /me. */
  setProfile: (profile: { role: string | null; maskedRoom: string | null }) => void;
  /** Logout or unrecoverable auth failure — clear everything, back to auth stack. */
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'bootstrapping',
  role: null,
  maskedRoom: null,

  bootstrapResolved: (authed) => set({ status: authed ? 'authenticated' : 'unauthenticated' }),
  signedIn: () => set({ status: 'authenticated' }),
  setProfile: ({ role, maskedRoom }) => set({ role, maskedRoom }),
  reset: () => set({ status: 'unauthenticated', role: null, maskedRoom: null }),
}));
