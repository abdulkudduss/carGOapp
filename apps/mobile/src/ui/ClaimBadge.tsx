import { badgeClaim } from '@cargo/tokens';
import { BadgeBase } from './badge-base';
import { CLAIM_LABELS, type ClaimValue } from './labels';

export interface ClaimBadgeProps {
  claim: ClaimValue;
}

/**
 * ClaimBadge (RN) — axis-2 (`claim_status`) only. Prop type is `ClaimValue`, so
 * a status value is a compile error (TZ §3/§12). CLAIMED carries its token
 * border (near-neutral fill needs an edge); the others have none.
 */
export function ClaimBadge({ claim }: ClaimBadgeProps) {
  const c = badgeClaim[claim];
  const border = 'border' in c ? c.border : undefined;
  return <BadgeBase bg={c.bg} fg={c.text} border={border} label={CLAIM_LABELS[claim]} />;
}
