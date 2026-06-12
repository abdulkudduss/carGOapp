import { badgeStatus } from '@cargo/tokens';
import { BadgeBase } from './badge-base';
import { STATUS_LABELS, type StatusValue } from './labels';

export interface StatusBadgeProps {
  status: StatusValue;
}

/**
 * StatusBadge (RN) — axis-1 (`status`) only. Prop type is `StatusValue`, so a
 * claim value is a compile error (TZ §3/§12). Colors straight from the
 * `badgeStatus` token map; RU label from §3.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const c = badgeStatus[status];
  return <BadgeBase bg={c.bg} fg={c.text} label={STATUS_LABELS[status]} />;
}
