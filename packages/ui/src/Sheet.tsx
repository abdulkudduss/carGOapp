import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './util.ts';

type Variant = 'modal' | 'sheet';

interface OverlaySurfaceProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Hide the × button (e.g. a blocking confirm). Esc still closes. */
  hideClose?: boolean;
}

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // lock background scroll while open
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

function Overlay({ variant, open, onClose, title, children, footer, hideClose }: OverlaySurfaceProps & { variant: Variant }) {
  useOverlay(open, onClose);
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cx('cui', 'cui-overlay', variant === 'modal' ? 'cui-overlay--center' : 'cui-overlay--right')}
      onClick={onClose}
    >
      <div
        className={cx('cui-surface', variant === 'modal' ? 'cui-modal' : 'cui-sheet')}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <div className="cui-surface__header">
            <span>{title}</span>
            {!hideClose && (
              <button type="button" className="cui-iconbtn" aria-label="Закрыть" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="cui-surface__body">{children}</div>
        {footer && <div className="cui-surface__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export type ModalProps = OverlaySurfaceProps;

/** Modal — centered dialog (confirmations, short forms). Portal + Esc + scrim. */
export function Modal(props: ModalProps) {
  return <Overlay variant="modal" {...props} />;
}

export type SheetProps = OverlaySurfaceProps;

/** Sheet — right-side slide-over (details, secondary flows). Same shell as Modal. */
export function Sheet(props: SheetProps) {
  return <Overlay variant="sheet" {...props} />;
}
