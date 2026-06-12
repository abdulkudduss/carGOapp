import { BadgeBase } from './badge-base.tsx';
import { CLAIM_LABELS, type ClaimValue } from './labels.ts';

export interface ClaimBadgeProps {
  /** A value of the `claim_status` axis (whose parcel it is). 3 values. */
  claim: ClaimValue;
  dot?: boolean;
}

/**
 * ClaimBadge — the ONLY way to render an axis-2 (`claim_status`) badge. Its prop
 * type is `ClaimValue`, so a `status` value is a compile error here (TZ §3/§12).
 * CLAIMED carries a token border (`--claim-CLAIMED-border`) because its fill is
 * near-neutral and needs an edge; the other two have none.
 */
export function ClaimBadge({ claim, dot = false }: ClaimBadgeProps) {
  return (
    <BadgeBase
      bg={`var(--claim-${claim}-bg)`}
      fg={`var(--claim-${claim}-text)`}
      border={claim === 'CLAIMED' ? `var(--claim-CLAIMED-border)` : undefined}
      label={CLAIM_LABELS[claim]}
      dot={dot}
      title={CLAIM_LABELS[claim]}
      data-claim={claim}
    />
  );
}
