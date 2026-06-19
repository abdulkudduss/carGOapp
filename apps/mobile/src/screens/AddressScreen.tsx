// AddressScreen — "Мой адрес в Японии" (TZ §6.2). The client shows this address
// to a Japanese sender; the personal Room is what routes a parcel to them, so
// nothing here is ever hardcoded — every line comes from GET /me.
//
// Data: reuse useMe() (no dedicated address endpoint). The server assembles the
// address into ONE string `MeResponse.jpAddress` of the form
// "<warehouse address> / <Room>" (verified against the backend), so the Room is
// already embedded — we never inject it ourselves. We split that string into its
// parts so each is its own copyable row (split on " / " and newlines, so a
// future multi-line address Just Works); we display exactly what the server sent.
//
// States (§8.5): loading → Skeleton; error / no address → EmptyState + Retry;
// data → address card. Tapping a row copies that line and toasts "Скопировано".

import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { role, space, type, TOUCH_MIN } from '../ui/theme';
import { t } from '../i18n';
import { useMe } from '../api/hooks';

// Invert the server's join ("<address> / <Room>") into display rows. Newline-
// tolerant so a future multi-line address renders one row per line. Trim + drop
// blanks so a trailing separator never yields an empty row.
function toAddressLines(jpAddress: string | undefined): string[] {
  if (!jpAddress) return [];
  return jpAddress
    .split('\n')
    .flatMap((line) => line.split(' / '))
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AddressScreen() {
  const me = useMe();
  const { toast } = useToast();

  const lines = toAddressLines(me.data?.jpAddress);

  const onCopy = async (line: string) => {
    await Clipboard.setStringAsync(line);
    toast({ title: t('address.copied'), variant: 'success' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {me.isPending ? (
          <Card>
            <View style={styles.lines}>
              <Skeleton width="90%" height={20} />
              <Skeleton width="70%" height={20} />
            </View>
          </Card>
        ) : me.isError || lines.length === 0 ? (
          <EmptyState
            title={t('address.error')}
            icon="📦"
            action={
              <Button title={t('common.retry')} variant="secondary" onPress={() => me.refetch()} />
            }
          />
        ) : (
          <Card footer={<Text style={styles.hint}>{t('address.hint')}</Text>}>
            <View>
              {lines.map((line, i) => (
                <Pressable
                  key={`${i}-${line}`}
                  accessibilityRole="button"
                  accessibilityLabel={t('address.copy')}
                  onPress={() => onCopy(line)}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={styles.rowText}>{line}</Text>
                  <Text style={styles.copyIcon}>⧉</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  content: { padding: space[6], gap: space[4] },
  lines: { gap: space[3] },
  row: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    paddingVertical: space[2],
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: role.border.subtle },
  rowPressed: { opacity: 0.6 },
  rowText: {
    flex: 1,
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    color: role.text.primary,
  },
  copyIcon: {
    fontSize: type.lg.fontSize,
    lineHeight: type.lg.lineHeight,
    color: role.accent.primary,
  },
  hint: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    color: role.text.muted,
  },
});
