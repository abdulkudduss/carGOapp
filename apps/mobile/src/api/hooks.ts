// Endpoint hooks — the seam between screens and the server. Screens never call
// `api` directly; they use these. TanStack Query models the two server shapes
// the reference flow needs (TZ §8 split):
//
//   • otp/request, otp/verify → mutations (user-triggered writes).
//   • /me                     → query (cacheable read; its loading/error states
//                               drive the authed screen, per TZ §8.5).
//
// Endpoint paths + request/response types come from @cargo/api's generated
// OpenAPI schema, so a backend contract change shows up as a type error here.
// Public OTP calls pass `auth: false` (no token yet — and a stray 401 must not
// trip the refresh/logout path).

import { useMutation, useQuery } from '@tanstack/react-query';
import type { schema } from '@cargo/api';
import { api } from './client';

type MeResponse = schema.components['schemas']['MeResponse'];
type TokenPair = schema.components['schemas']['TokenPair'];

// otp/request returns ApiResponseMapStringInteger → data is a string→int map; the
// resend cooldown is `retry_after_sec` (confirmed against the live backend). The
// server owns the timer — the client never hardcodes it (TZ §6.1).
type OtpRequestResult = Record<string, number>;

export const meQueryKey = ['me'] as const;

/** POST /auth/otp/request — sends the SMS, returns the resend cooldown. */
export function useRequestOtp() {
  return useMutation<number, unknown, { phone: string }>({
    mutationFn: async ({ phone }) => {
      const data = await api.post<OtpRequestResult>(
        '/api/v1/auth/otp/request',
        { phone },
        { auth: false },
      );
      return data?.retry_after_sec ?? 0;
    },
  });
}

/** POST /auth/otp/verify — exchanges the code for a token pair. */
export function useVerifyOtp() {
  return useMutation<TokenPair, unknown, { phone: string; code: string }>({
    mutationFn: ({ phone, code }) =>
      api.post<TokenPair>('/api/v1/auth/otp/verify', { phone, code }, { auth: false }),
  });
}

/** GET /me — current client's profile/context (role, masked room, locale, …). */
export function useMe(enabled = true) {
  return useQuery<MeResponse>({
    queryKey: meQueryKey,
    queryFn: () => api.get<MeResponse>('/api/v1/me'),
    enabled,
  });
}
