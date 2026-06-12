import type { CSSProperties } from 'react';
import { cx } from './util.ts';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  /** Pill shape for avatar/badge placeholders. */
  rounded?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton — shimmer placeholder for loading states (TZ §8.5 — обязательное
 * состояние каждого экрана). Honors `prefers-reduced-motion`. Compose several to
 * mimic a card/row while data loads.
 */
export function Skeleton({ width = '100%', height = 16, rounded, className, style }: SkeletonProps) {
  return (
    <span
      className={cx('cui', 'cui-skeleton', className)}
      aria-hidden="true"
      style={{ width, height, borderRadius: rounded ? 9999 : undefined, ...style }}
    />
  );
}
