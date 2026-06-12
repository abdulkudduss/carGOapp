import { BadgeBase } from './badge-base.tsx';
import { STATUS_LABELS, type StatusValue } from './labels.ts';

export interface StatusBadgeProps {
  /** A value of the `status` axis (where the parcel physically is). 10 values. */
  status: StatusValue;
  dot?: boolean;
}

/**
 * StatusBadge — the ONLY way to render an axis-1 (`status`) badge. Its prop type
 * is `StatusValue`, so the compiler rejects a `claim_status` value here: the two
 * axes can never be mixed at a call site (TZ §3/§12). Colors come from the
 * `--badge-{VALUE}-{bg|text}` token vars; the RU label from §3.
 */
export function StatusBadge({ status, dot = false }: StatusBadgeProps) {
  return (
    <BadgeBase
      bg={`var(--badge-${status}-bg)`}
      fg={`var(--badge-${status}-text)`}
      label={STATUS_LABELS[status]}
      dot={dot}
      title={STATUS_LABELS[status]}
      data-status={status}
    />
  );
}
