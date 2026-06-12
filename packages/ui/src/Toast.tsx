import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './util.ts';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after N ms. 0 keeps it until dismissed. Default 4000. */
  duration?: number;
}

/** Presentational single toast — colored left edge by variant (role/intent tokens). */
export function Toast({
  title,
  description,
  variant = 'info',
  onDismiss,
}: {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
}) {
  return (
    <div className={cx('cui', 'cui-toast', `cui-toast--${variant}`)} role="status" aria-live="polite">
      <div className="cui-toast__body">
        <div className="cui-toast__title">{title}</div>
        {description && <div className="cui-toast__desc">{description}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="cui-iconbtn" aria-label="Закрыть" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}

interface ToastContextValue {
  toast: (t: Omit<ToastData, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * ToastProvider — owns the ephemeral toast queue (UI state, not app data) and
 * renders a fixed viewport via a portal. Wrap an app once; call `useToast()`
 * anywhere to push a toast. Auto-dismiss is timer-based and cleaned up on unmount.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<ToastData, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((list) => [...list, { ...t, id }]);
      const duration = t.duration ?? 4000;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const timersAtMount = timers.current;
  useEffect(() => () => timersAtMount.forEach(clearTimeout), [timersAtMount]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="cui cui-toast-viewport">
            {toasts.map((t) => (
              <Toast
                key={t.id}
                title={t.title}
                description={t.description}
                variant={t.variant}
                onDismiss={() => dismiss(t.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
