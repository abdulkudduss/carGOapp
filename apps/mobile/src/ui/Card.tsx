import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { shadow } from '@cargo/tokens';
import { role, radius, space, type, weight, elevation } from './theme';

export interface CardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

/** Card (RN) — surface with subtle border + sm shadow; optional header/footer. */
export function Card({ header, footer, children }: CardProps) {
  return (
    <View style={[styles.card, elevation(shadow.sm)]}>
      {header != null && (
        <View style={[styles.section, styles.header]}>
          {typeof header === 'string' ? <Text style={styles.headerText}>{header}</Text> : header}
        </View>
      )}
      {children != null && <View style={styles.section}>{children}</View>}
      {footer != null && <View style={[styles.section, styles.footer]}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: role.bg.surface,
    borderWidth: 1,
    borderColor: role.border.subtle,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  section: { padding: space[6] },
  header: { borderBottomWidth: 1, borderBottomColor: role.border.subtle },
  headerText: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
  },
  footer: { borderTopWidth: 1, borderTopColor: role.border.subtle, backgroundColor: role.bg.sunken },
});
