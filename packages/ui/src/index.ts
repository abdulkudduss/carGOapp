// @cargo/ui — presentational web components for CARGO (web-ops + pvz), built on
// @cargo/tokens. Framework: React 19. Styling: authored CSS on token CSS vars —
// apps MUST import '@cargo/ui/styles.css' (after '@cargo/tokens/variables.css')
// and set data-density="compact|comfortable" on a root. No data fetching, forms,
// or routing — those live in the apps.

export { Button } from './Button.tsx';
export type { ButtonProps, ButtonVariant } from './Button.tsx';

export { Input, ScannerField } from './Input.tsx';
export type { InputProps, ScannerFieldProps } from './Input.tsx';

export { StatusBadge } from './StatusBadge.tsx';
export type { StatusBadgeProps } from './StatusBadge.tsx';
export { ClaimBadge } from './ClaimBadge.tsx';
export type { ClaimBadgeProps } from './ClaimBadge.tsx';

export { Card } from './Card.tsx';
export type { CardProps } from './Card.tsx';

export { Table } from './Table.tsx';
export type { Column, TableProps } from './Table.tsx';

export { Timeline } from './Timeline.tsx';
export type { TimelineProps, TimelineStep } from './Timeline.tsx';

export { Modal, Sheet } from './Sheet.tsx';
export type { ModalProps, SheetProps } from './Sheet.tsx';

export { Toast, ToastProvider, useToast } from './Toast.tsx';
export type { ToastData, ToastVariant } from './Toast.tsx';

export { Skeleton } from './Skeleton.tsx';
export type { SkeletonProps } from './Skeleton.tsx';

export { EmptyState } from './EmptyState.tsx';
export type { EmptyStateProps } from './EmptyState.tsx';

// Axis labels + ordered value lists (TZ §3) — re-exported for showcases/tables.
export {
  STATUS_LABELS,
  CLAIM_LABELS,
  STATUS_ORDER,
  CLAIM_ORDER,
} from './labels.ts';
export type { StatusValue, ClaimValue } from './labels.ts';
