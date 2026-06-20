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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { schema } from '@cargo/api';
import { api } from './client';

type MeResponse = schema.components['schemas']['MeResponse'];
type TokenPair = schema.components['schemas']['TokenPair'];
type ParcelSummary = schema.components['schemas']['ParcelSummary'];
type ParcelDetail = schema.components['schemas']['ParcelDetail'];
type PageParcelSummary = schema.components['schemas']['PageResponseParcelSummary'];
type ParcelSearchResponse = schema.components['schemas']['ParcelSearchResponse'];
type PreAlert = schema.components['schemas']['PreAlertResponse'];
type CreatePreAlertRequest = schema.components['schemas']['CreatePreAlertRequest'];
type Category = schema.components['schemas']['CategoryResponse'];
type Pvz = schema.components['schemas']['PvzResponse'];

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

// Parcel reads. Paths are /api/v1/me/parcels[/{id}] (verified against the
// backend ParcelController — the OpenAPI artifact has the response types but is
// missing these GET paths). The Bearer token is attached by the client. The
// backend returns ONLY the caller's CLAIMED parcels (sorted createdAt desc), so
// the front never filters. 30s staleTime; screens pull-to-refresh via refetch().
const PARCELS_STALE_MS = 30_000;

export const parcelsQueryKey = ['parcels'] as const;
export const parcelQueryKey = (id: string) => ['parcel', id] as const;

/** GET /me/parcels — the caller's parcel list (paged response → items). */
export function useParcels() {
  return useQuery<ParcelSummary[]>({
    queryKey: parcelsQueryKey,
    queryFn: async () => {
      const page = await api.get<PageParcelSummary>('/api/v1/me/parcels');
      return page?.items ?? [];
    },
    staleTime: PARCELS_STALE_MS,
  });
}

/** GET /me/parcels/{id} — one parcel with its status history + assigned PVZ. */
export function useParcel(id: string) {
  return useQuery<ParcelDetail>({
    queryKey: parcelQueryKey(id),
    queryFn: () => api.get<ParcelDetail>(`/api/v1/me/parcels/${id}`),
    staleTime: PARCELS_STALE_MS,
  });
}

// Track-search + claim + dispute (TZ §6.4). A client whose parcel arrived
// UNCLAIMED (no pre-alert) looks it up by track number, then either claims it or
// contests another client's claim.
//
// `parcel_id` is returned by the search so the found UNCLAIMED parcel can be
// claimed/disputed right away (both address it by /parcels/{id}/..., int64). The
// generated type marks it optional (springdoc makes every field optional); the
// endpoint always returns it for a found parcel, so we narrow it to required.
export type TrackSearchResult = Omit<ParcelSearchResponse, 'parcel_id'> & { parcel_id: number };

/**
 * GET /me/parcels/search?number= — authenticated lookup by track number (the
 * client identity comes from the JWT). Imperative (a user action, not a
 * cacheable read) → a mutation, not useQuery. Throws ApiError (e.g. code
 * PARCEL_NOT_FOUND). NOTE: the live query param is `number`, not `track`.
 */
export function useTrackSearch() {
  return useMutation<TrackSearchResult, unknown, string>({
    mutationFn: (trackNumber) =>
      api.get<TrackSearchResult>('/api/v1/me/parcels/search', {
        query: { number: trackNumber },
      }),
  });
}

/**
 * POST /parcels/{id}/claim — self-attach a found UNCLAIMED parcel. Empty body:
 * the client identity comes from the JWT, and the backend ClaimRequest no longer
 * needs a declaration. Idempotent (a retried tap must not double-apply, TZ §8.3).
 * Surfaces ALREADY_CLAIMED (409) as a machine code for the screen.
 */
export function useClaimParcel() {
  return useMutation<ParcelDetail, unknown, number>({
    mutationFn: (id) => api.post<ParcelDetail>(`/api/v1/parcels/${id}/claim`, {}, { idempotent: true }),
  });
}

/**
 * POST /parcels/{id}/dispute — contest a parcel claimed by another client. Body
 * is an optional comment. Idempotent: a retried tap must not open a second
 * dispute, so the client sends an Idempotency-Key (TZ §8.3). Surfaces
 * ALREADY_DISPUTED (409) / CANNOT_DISPUTE (422) as machine codes for the screen.
 */
export function useDisputeParcel() {
  return useMutation<ParcelDetail, unknown, { id: number; comment?: string }>({
    mutationFn: ({ id, comment }) =>
      api.post<ParcelDetail>(`/api/v1/parcels/${id}/dispute`, { comment }, { idempotent: true }),
  });
}

// Pre-alerts (TZ §6.5). A client announces an expected parcel by track number so
// it auto-matches on arrival. Paths verified against the live backend:
//   GET    /me/parcels … no — GET/POST /me/pre-alerts, DELETE /me/pre-alerts/{id}.
// The list returns PreAlertResponse[] (server-owned `status`: ACTIVE | MATCHED |
// CANCELLED; only `category_id`, never the category name). DELETE is a SOFT
// delete: it returns 204 and flips the row to CANCELLED — the row keeps appearing
// in the list, so the screen filters CANCELLED out of what it shows. 30s
// staleTime; the screen pull-to-refreshes via refetch(). Mutations invalidate the
// list here (in the hook) so screens don't repeat it.
const PRE_ALERTS_STALE_MS = 30_000;

export const preAlertsQueryKey = ['pre-alerts'] as const;

/** GET /me/pre-alerts — the caller's pre-alerts (newest first, server-sorted). */
export function usePreAlerts() {
  return useQuery<PreAlert[]>({
    queryKey: preAlertsQueryKey,
    queryFn: async () => {
      const data = await api.get<PreAlert[]>('/api/v1/me/pre-alerts');
      return data ?? [];
    },
    staleTime: PRE_ALERTS_STALE_MS,
  });
}

/**
 * POST /me/pre-alerts — announce an expected parcel. `currency` is optional (the
 * backend defaults it to JPY), so the form omits it. A duplicate active track
 * surfaces as code PRE_ALERT_DUPLICATE (409) — a typed business answer the screen
 * turns into a specific message, never a generic «Ошибка» toast.
 */
export function useCreatePreAlert() {
  const queryClient = useQueryClient();
  return useMutation<PreAlert, unknown, CreatePreAlertRequest>({
    mutationFn: (body) => api.post<PreAlert>('/api/v1/me/pre-alerts', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: preAlertsQueryKey }),
  });
}

/** DELETE /me/pre-alerts/{id} — cancel a pre-alert (soft delete → CANCELLED). */
export function useDeletePreAlert() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`/api/v1/me/pre-alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: preAlertsQueryKey }),
  });
}

// Preferred PVZ (ПВЗ) — the client's default pickup point (TZ §6.7). The list is
// PUBLIC (Swagger: «Список активных ПВЗ (без авторизации)») so usePvzList passes
// `auth: false`; the change is PATCH /me/preferred-pvz with the JWT. The list
// changes rarely → 5-min staleTime. Setting the preference invalidates /me so the
// profile's preferred_pvz_name/_id reflect the new choice on next render.
const PVZ_STALE_MS = 5 * 60_000;

export const pvzListQueryKey = ['pvz'] as const;

/** GET /pvz — active pickup points ({ id, name, address }). Public, no token. */
export function usePvzList() {
  return useQuery<Pvz[]>({
    queryKey: pvzListQueryKey,
    queryFn: async () => {
      const data = await api.get<Pvz[]>('/api/v1/pvz', { auth: false });
      return data ?? [];
    },
    staleTime: PVZ_STALE_MS,
  });
}

/** PATCH /me/preferred-pvz — set the default pickup point; refresh /me after. */
export function useSetPreferredPvz() {
  const queryClient = useQueryClient();
  return useMutation<MeResponse, unknown, number>({
    mutationFn: (warehouseId) =>
      api.patch<MeResponse>('/api/v1/me/preferred-pvz', { warehouse_id: warehouseId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  });
}

export const categoriesQueryKey = ['categories'] as const;

/**
 * GET /categories — active category reference data ({ id, code, name_ru/ky/ja }).
 * Feeds the pre-alert form's `category_id` picker and resolves id → name on the
 * list. Effectively static within a session → staleTime Infinity (no refetch).
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      const data = await api.get<Category[]>('/api/v1/categories');
      return data ?? [];
    },
    staleTime: Infinity,
  });
}
