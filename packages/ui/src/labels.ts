import type { badgeStatus, badgeClaim } from '@cargo/tokens';

// RU labels for the two independent axes (TZ §3). Kept here, inside the UI
// layer, so the badge components are the single place that maps an axis value to
// its human label — call sites never hand-write status strings.

export type StatusValue = keyof typeof badgeStatus;
export type ClaimValue = keyof typeof badgeClaim;

// Axis 1 — `status` (where the parcel physically is). 10 values, in flow order.
export const STATUS_LABELS: Record<StatusValue, string> = {
  AT_JP: 'На складе в Японии',
  PACKED: 'Упакована к отправке',
  SHIPPED: 'В пути',
  CUSTOMS: 'На таможне',
  AT_KG: 'Прибыла в Кыргызстан',
  DELIVERY: 'Передана в доставку/ПВЗ',
  DONE: 'Выдана',
  RETURNED: 'Возвращена',
  LOST: 'Утеряна',
  DISPOSED: 'Утилизирована',
};

// Axis 2 — `claim_status` (whose parcel it is). 3 values.
export const CLAIM_LABELS: Record<ClaimValue, string> = {
  UNCLAIMED: 'Не привязана',
  CLAIMED: 'Привязана к клиенту',
  DISPUTED: 'Спорная',
};

// Flow-ordered status list — used by Timeline and showcases so the sequence is
// canonical, not object-key order.
export const STATUS_ORDER: readonly StatusValue[] = [
  'AT_JP',
  'PACKED',
  'SHIPPED',
  'CUSTOMS',
  'AT_KG',
  'DELIVERY',
  'DONE',
  'RETURNED',
  'LOST',
  'DISPOSED',
];

export const CLAIM_ORDER: readonly ClaimValue[] = ['UNCLAIMED', 'CLAIMED', 'DISPUTED'];
