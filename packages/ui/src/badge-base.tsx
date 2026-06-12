import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from './util.ts';

// Internal shared shell for the two typed badge components. NOT exported from the
// package — callers must use StatusBadge or ClaimBadge so the axis can never be
// mixed (TZ §3/§12). This is the single place that reaches into the badge CSS
// vars; the typed wrappers compute the var names from their own axis literals.
export interface BadgeBaseProps extends HTMLAttributes<HTMLSpanElement> {
  bg: string;
  fg: string;
  border?: string;
  label: string;
  /** Small leading dot in the text color — redundant-with-text affordance. */
  dot?: boolean;
}

export function BadgeBase({ bg, fg, border, label, dot = false, className, ...rest }: BadgeBaseProps) {
  const style: CSSProperties = {
    backgroundColor: bg,
    color: fg,
    borderColor: border ?? 'transparent',
  };
  return (
    <span className={cx('cui', 'cui-badge', className)} style={style} {...rest}>
      {dot && <span className="cui-badge__dot" aria-hidden="true" />}
      <span className="cui-badge__label">{label}</span>
    </span>
  );
}
