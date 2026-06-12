import type { ReactNode } from 'react';
import { cx } from './util.ts';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Glyph/emoji or a small node shown above the title. */
  icon?: ReactNode;
  /** Primary action (e.g. a retry Button) — rendered under the text. */
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — the "nothing here / retry" screen state (TZ §8.5). Use for empty
 * lists and network-error retries (pass a Button as `action`).
 */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cx('cui', 'cui-empty', className)}>
      {icon && <div className="cui-empty__icon" aria-hidden="true">{icon}</div>}
      <div className="cui-empty__title">{title}</div>
      {description && <div className="cui-empty__desc">{description}</div>}
      {action}
    </div>
  );
}
