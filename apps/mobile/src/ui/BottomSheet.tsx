import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { role, radius, space, type, weight } from './theme';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * BottomSheet (RN) — slide-up sheet over a scrim, built on the native Modal.
 * Tapping the scrim or hardware-back closes it.
 */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.body}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,23,18,0.45)' },
  sheet: {
    backgroundColor: role.bg.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: space[8],
    maxHeight: '85%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: role.border.strong,
    marginTop: space[2],
    marginBottom: space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: role.border.subtle,
  },
  title: { fontSize: type.lg.fontSize, lineHeight: type.lg.lineHeight, fontWeight: weight.semibold, color: role.text.primary },
  close: { fontSize: 28, lineHeight: 28, color: role.text.secondary },
  body: { padding: space[6] },
  footer: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[6],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: role.border.subtle,
  },
});
