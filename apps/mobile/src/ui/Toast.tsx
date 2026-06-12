import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, shadow } from '@cargo/tokens';
import { role, radius, space, type, weight, elevation } from './theme';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

const EDGE: Record<ToastVariant, string> = {
  info: color.info[600],
  success: color.success[600],
  warning: color.warning[600],
  danger: role.intent.danger.fg,
};

/** Presentational single toast — colored left edge by variant. */
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
    <View style={[styles.toast, { borderLeftColor: EDGE[variant] }, elevation(shadow.md)]}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
      </View>
      {onDismiss && (
        <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onDismiss} hitSlop={8}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** ToastProvider (RN) — owns the queue and renders a bottom overlay. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<ToastData, 'id'>) => {
      const id = String(++seq.current);
      setToasts((list) => [...list, { ...t, id }]);
      const duration = t.duration ?? 4000;
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.viewport}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  viewport: { position: 'absolute', left: space[4], right: space[4], bottom: space[8], gap: space[2] },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    padding: space[3],
    backgroundColor: role.bg.surface,
    borderWidth: 1,
    borderColor: role.border.subtle,
    borderLeftWidth: 3,
    borderRadius: radius.md,
  },
  body: { flex: 1 },
  title: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, fontWeight: weight.semibold, color: role.text.primary },
  desc: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.secondary },
  close: { fontSize: 22, lineHeight: 22, color: role.text.secondary },
});
