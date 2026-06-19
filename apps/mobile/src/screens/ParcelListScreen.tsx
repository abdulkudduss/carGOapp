// ParcelListScreen — the client's parcels (TZ §3). Reuses useParcels(); the
// backend returns only the caller's CLAIMED parcels, so the front never filters.
// States (§8.5): loading → 3 skeleton cards; error → EmptyState + Retry; empty →
// EmptyState; data → FlatList of cards. Pull-to-refresh = refetch (not invalidate).
//
// A parcel's `status` arrives as a plain string; we narrow it to StatusValue
// before passing it to StatusBadge (badgeStatus is keyed by StatusValue). The
// backend ParcelStatus enum matches STATUS_LABELS exactly, so this is a safety
// guard, not a lossy filter.

import { useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { STATUS_LABELS, type StatusValue } from '../ui/labels';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { useParcels } from '../api/hooks';
import type { ClientScreenProps } from '../navigation/types';

const STATUS_KEYS = new Set<string>(Object.keys(STATUS_LABELS));
function asStatus(s: string | undefined): StatusValue | null {
  return s != null && STATUS_KEYS.has(s) ? (s as StatusValue) : null;
}

export function ParcelListScreen() {
  const navigation = useNavigation<ClientScreenProps<'ParcelList'>['navigation']>();
  const parcels = useParcels();

  if (parcels.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <View style={styles.cardLines}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
              </View>
            </Card>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (parcels.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          title={t('parcels.error')}
          icon="📦"
          action={<Button title={t('common.retry')} variant="secondary" onPress={() => parcels.refetch()} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={parcels.data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={parcels.isRefetching} onRefresh={() => parcels.refetch()} />
        }
        ListEmptyComponent={<EmptyState title={t('parcels.empty')} icon="📦" />}
        renderItem={({ item }) => {
          const status = asStatus(item.status);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('ParcelDetail', { parcelId: String(item.id) })}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card>
                <View style={styles.cardLines}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.code}>{item.parcel_code}</Text>
                    {status && <StatusBadge status={status} />}
                  </View>

                  {item.track_number != null && (
                    <Text style={styles.muted}>
                      {t('parcel.track')}: {item.track_number}
                    </Text>
                  )}

                  <View style={styles.rowBetween}>
                    {item.weight_g != null ? (
                      <Text style={styles.muted}>{t('parcel.weightValue', { kg: gToKg(item.weight_g) })}</Text>
                    ) : (
                      <View />
                    )}
                    {item.amount_due != null && (
                      <Text style={styles.amount}>
                        {item.amount_due} {item.amount_currency ?? ''}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

// Grams → kg, one decimal, no trailing ".0" (1000 → "1", 1234 → "1.2").
function gToKg(g: number): number {
  return Math.round(g / 100) / 10;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  list: { padding: space[6], gap: space[4], flexGrow: 1 },
  cardLines: { gap: space[2] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  pressed: { opacity: 0.7 },
  code: {
    fontSize: type.lg.fontSize,
    lineHeight: type.lg.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
    flexShrink: 1,
  },
  muted: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted },
  amount: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
  },
});
