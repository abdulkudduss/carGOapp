import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { role, space, type, weight } from './theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
}

/** EmptyState (RN) — empty list / network-error state (TZ §8.5). */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: space[3], paddingVertical: space[12], paddingHorizontal: space[6] },
  icon: { fontSize: 32, lineHeight: 36 },
  title: { fontSize: type.lg.fontSize, lineHeight: type.lg.lineHeight, fontWeight: weight.semibold, color: role.text.primary, textAlign: 'center' },
  desc: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, color: role.text.muted, textAlign: 'center', maxWidth: 320 },
});
