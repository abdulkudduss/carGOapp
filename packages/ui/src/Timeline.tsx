import { StatusBadge } from './StatusBadge.tsx';
import type { StatusValue } from './labels.ts';
import { cx } from './util.ts';

export interface TimelineStep {
  status: StatusValue;
  /** Pre-formatted date/time string from the server (never computed here). */
  at?: string;
  state?: 'done' | 'current' | 'upcoming';
}

export interface TimelineProps {
  steps: readonly TimelineStep[];
  className?: string;
}

/**
 * Timeline — vertical history of the `status` axis ONLY. By construction it
 * cannot show `claim_status`: its step type is `StatusValue`, so an axis-2 value
 * is a type error (TZ §3 — claim_status is a separate badge, never a step). Each
 * step reuses StatusBadge, so step colors come straight from the status tokens.
 * Dates are rendered as given; nothing is computed on the client.
 */
export function Timeline({ steps, className }: TimelineProps) {
  return (
    <ol className={cx('cui', 'cui-timeline', className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const state = step.state ?? 'done';
        return (
          <li
            key={`${step.status}-${i}`}
            className={cx('cui-timeline__item', `cui-timeline__item--${state}`)}
          >
            <div className="cui-timeline__rail" aria-hidden="true">
              <span
                className={cx('cui-timeline__dot', state === 'current' && 'cui-timeline__dot--current')}
                style={{ background: `var(--badge-${step.status}-text)` }}
              />
              {!isLast && <span className="cui-timeline__line" />}
            </div>
            <div className="cui-timeline__body">
              <StatusBadge status={step.status} />
              {step.at && <div className="cui-timeline__meta">{step.at}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
