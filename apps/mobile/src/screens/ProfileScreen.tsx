// ProfileScreen — the client's profile (TZ §6.7). Read-only client data (phone,
// Room) comes from useMe() — no dedicated profile endpoint, no second request.
// The one editable thing is the preferred PVZ (ПВЗ): tapping «Изменить» opens a
// BottomSheet listing active pickup points (usePvzList, public), and a tap there
// fires useSetPreferredPvz(), which invalidates /me so preferred_pvz_name updates
// in place. Logout is local (clear SecureStore tokens + reset session) — the gate
// (RootNavigator) flips back to the auth stack; no API call (mirrors PvzStack).
//
// States (§8.5): loading → Skeleton; error → EmptyState + Retry.
//
// The sheet is a native Modal (its own window): an error toast fired while it's
// open renders BEHIND it and is invisible (see PreAlertListScreen). So the sheet
// reports failures INLINE and stays open; success closes the sheet first, then
// toasts on the now-visible profile.

import { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { BottomSheet } from '../ui/BottomSheet';
import { useToast } from '../ui/Toast';
import { role, radius, space, type, weight, TOUCH_MIN } from '../ui/theme';
import { t } from '../i18n';
import { errorToMessage } from '../api/errorToMessage';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';
import { useMe, usePvzList, useSetPreferredPvz } from '../api/hooks';

export function ProfileScreen() {
  const me = useMe();
  const reset = useSessionStore((s) => s.reset);
  const { toast } = useToast();

  const pvzList = usePvzList();
  const setPreferred = useSetPreferredPvz();

  const [sheetOpen, setSheetOpen] = useState(false);
  // Errors are shown INLINE in the sheet, not via toast: the sheet is a native
  // Modal, so a toast fired behind it would be occluded (see PreAlertListScreen).
  const [sheetError, setSheetError] = useState<string | null>(null);

  const openSheet = () => {
    setSheetError(null);
    setSheetOpen(true);
  };

  const onLogout = async () => {
    await tokenStore.clear();
    reset();
  };

  const onSelectPvz = (warehouseId: number) => {
    setSheetError(null);
    setPreferred.mutate(warehouseId, {
      onSuccess: () => {
        // Close first so the toast lands on the visible profile (not behind the Modal).
        setSheetOpen(false);
        toast({ title: t('profile.pvz_updated'), variant: 'success' });
      },
      onError: (e) => setSheetError(errorToMessage(e)),
    });
  };

  if (me.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.lines}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="70%" height={20} />
              <Skeleton width="40%" height={16} />
              <Skeleton width="60%" height={20} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (me.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          title={t('profile.error')}
          icon="👤"
          action={<Button title={t('common.retry')} variant="secondary" onPress={() => me.refetch()} />}
        />
      </SafeAreaView>
    );
  }

  const preferredId = me.data?.preferred_pvz_id;
  const preferredName = me.data?.preferred_pvz_name;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Client data — display only (TZ §6.7: phone/Room are not editable here). */}
        <Card>
          <View style={styles.lines}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.phone')}</Text>
              <Text style={styles.value}>{me.data?.phone ?? '—'}</Text>
            </View>
            <View style={[styles.field, styles.fieldDivider]}>
              <Text style={styles.label}>{t('profile.room')}</Text>
              <Text style={styles.value}>{me.data?.maskedRoom ?? '—'}</Text>
            </View>
          </View>
        </Card>

        {/* Preferred PVZ — the one editable field. */}
        <Card>
          <View style={styles.pvzHeader}>
            <Text style={styles.label}>{t('profile.pvz_section')}</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={openSheet}>
              <Text style={styles.changeLink}>{t('profile.pvz_change')}</Text>
            </Pressable>
          </View>
          <Text style={[styles.value, preferredName == null && styles.valueMuted]}>
            {preferredName ?? t('profile.pvz_not_set')}
          </Text>
        </Card>

        <Button title={t('profile.logout')} variant="secondary" onPress={onLogout} fullWidth />
      </ScrollView>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('profile.pvz_select_title')}>
        {pvzList.isPending ? (
          <View style={styles.lines}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height={48} />
            ))}
          </View>
        ) : pvzList.isError ? (
          <EmptyState
            title={t('profile.pvz_error')}
            icon="📍"
            action={<Button title={t('common.retry')} variant="secondary" onPress={() => pvzList.refetch()} />}
          />
        ) : (
          <FlatList
            data={pvzList.data}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<EmptyState title={t('profile.pvz_empty')} icon="📍" />}
            ListFooterComponent={
              sheetError ? <Text style={styles.sheetError}>{sheetError}</Text> : null
            }
            renderItem={({ item }) => {
              if (item.id == null) return null;
              const id = item.id;
              const selected = preferredId === id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={setPreferred.isPending}
                  onPress={() => onSelectPvz(id)}
                  style={({ pressed }) => [styles.pvzRow, pressed && styles.rowPressed]}
                >
                  <View style={styles.pvzRowText}>
                    <Text style={styles.pvzName}>{item.name}</Text>
                    {item.address != null && <Text style={styles.pvzAddress}>{item.address}</Text>}
                  </View>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  content: { padding: space[6], gap: space[4] },
  lines: { gap: space[3] },
  field: { gap: space[1] },
  fieldDivider: { borderTopWidth: 1, borderTopColor: role.border.subtle, paddingTop: space[3] },
  label: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    fontWeight: weight.medium,
    color: role.text.secondary,
  },
  value: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, color: role.text.primary },
  valueMuted: { color: role.text.muted },
  pvzHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  changeLink: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    fontWeight: weight.semibold,
    color: role.accent.primary,
  },
  // PVZ list inside the sheet
  separator: { height: 1, backgroundColor: role.border.subtle },
  pvzRow: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    paddingVertical: space[3],
  },
  rowPressed: { opacity: 0.6 },
  pvzRowText: { flex: 1, gap: space[1] },
  pvzName: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
  },
  pvzAddress: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted },
  check: { fontSize: type.lg.fontSize, lineHeight: type.lg.lineHeight, color: role.accent.primary },
  sheetError: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    color: role.intent.danger.fg,
    paddingTop: space[3],
  },
});
