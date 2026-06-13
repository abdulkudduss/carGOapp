// Single QueryClient for the app, provided at the root (see App.tsx).
// TanStack Query owns ALL server data (TZ §8 split); zustand owns session state.
//
// `retry: false` keeps the reference flow predictable: a wrong OTP or a network
// blip surfaces immediately to errorToMessage instead of being silently retried.
// Per-query overrides can opt back into retries where it makes sense.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
    mutations: { retry: false },
  },
});
