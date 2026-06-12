import type { badgeStatus, badgeClaim } from '@cargo/tokens';

// RU labels for the two axes (TZ §3). Mirrors @cargo/ui's labels, duplicated
// here because the web package (@cargo/ui) is web-only and must not be imported
// by React Native — the boundary from step 0. The shared source of truth is the
// token value set itself; these 13 strings are the only duplication.

export type StatusValue = keyof typeof badgeStatus;
export type ClaimValue = keyof typeof badgeClaim;

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

export const CLAIM_LABELS: Record<ClaimValue, string> = {
  UNCLAIMED: 'Не привязана',
  CLAIMED: 'Привязана к клиенту',
  DISPUTED: 'Спорная',
};

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
