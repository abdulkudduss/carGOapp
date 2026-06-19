// ParcelDetailScreen — one parcel (TZ §3). Reuses useParcel(id). Sections:
//   header   → parcel_code + StatusBadge + ClaimBadge
//   timeline → status axis ONLY (parcel.history). claim_status is NOT a step
//              (§3): we map only `status`, the StatusHistoryItem.claim_status
//              field is intentionally ignored here.
//   details  → weight, shop. (The prompt's "категория"/"фото" have no fields on
//              ParcelDetail in the schema, so those blocks are omitted.)
//   amount+pvz → amount as it came (no recompute); assigned PVZ name, or the
//              "будет назначен" notice when null — a normal state, not an error.
// States (§8.5): loading → Skeleton; error → EmptyState + Retry (refetch).
//
// status/claim_status arrive as plain strings; narrowed to the typed unions
// before hitting the badge/timeline components (enums verified to match).

import { ScrollView, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { ClaimBadge } from '../ui/ClaimBadge';
import { Timeline, type TimelineStep } from '../ui/Timeline';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { STATUS_LABELS, CLAIM_LABELS, type StatusValue, type ClaimValue } from '../ui/labels';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { useParcel } from '../api/hooks';
import type { ClientScreenProps } from '../navigation/types';

const STATUS_KEYS = new Set<string>(Object.keys(STATUS_LABELS));
const CLAIM_KEYS = new Set<string>(Object.keys(CLAIM_LABELS));
const asStatus = (s: string | undefined): StatusValue | null =>
  s != null && STATUS_KEYS.has(s) ? (s as StatusValue) : null;
const asClaim = (s: string | undefined): ClaimValue | null =>
  s != null && CLAIM_KEYS.has(s) ? (s as ClaimValue) : null;

// ISO date-time → "dd.MM.yyyy HH:mm" (no date lib; locale-stable display).
function formatDateTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const gToKg = (g: number): number => Math.round(g / 100) / 10;

export function ParcelDetailScreen({ route }: ClientScreenProps<'ParcelDetail'>) {
  const parcel = useParcel(route.params.parcelId);

  if (parcel.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton width="50%" height={28} />
          <Skeleton width="80%" height={120} />
          <Skeleton width="100%" height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (parcel.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          title={t('parcel.error')}
          icon="📦"
          action={<Button title={t('common.retry')} variant="secondary" onPress={() => parcel.refetch()} />}
        />
      </SafeAreaView>
    );
  }

  const p = parcel.data;
  const status = asStatus(p.status);
  const claim = asClaim(p.claim_status);

  // Status-axis steps only; fold an optional comment into the meta line, since
  // Timeline has no dedicated comment slot.
  const steps: TimelineStep[] = (p.history ?? [])
    .map((h): TimelineStep | null => {
      const s = asStatus(h.status);
      if (!s) return null;
      const meta = [formatDateTime(h.created_at), h.comment].filter(Boolean).join(' · ');
      return { status: s, at: meta || undefined };
    })
    .filter((s): s is TimelineStep => s !== null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 3a — header */}
        <View style={styles.header}>
          <Text style={styles.code}>{p.parcel_code}</Text>
          <View style={styles.badges}>
            {status && <StatusBadge status={status} />}
            {claim && <ClaimBadge claim={claim} />}
          </View>
        </View>

        {/* 3b — status timeline */}
        {steps.length > 0 && (
          <Card header={t('parcel.history')}>
            <Timeline steps={steps} />
          </Card>
        )}

        {/* 3c — details */}
        <Card header={t('parcel.details')}>
          <View style={styles.rows}>
            {p.weight_g != null && (
              <DetailRow label={t('parcel.weight')} value={t('parcel.weightValue', { kg: gToKg(p.weight_g) })} />
            )}
            {p.shop_name != null && <DetailRow label={t('parcel.shop')} value={p.shop_name} />}
          </View>
        </Card>

        {/* 3d — amount + PVZ, each in its own self-labeled card */}
        {p.amount_due != null && (
          <Card header={t('parcel.amount')}>
            <Text style={styles.value}>{`${p.amount_due} ${p.amount_currency ?? ''}`.trim()}</Text>
          </Card>
        )}

        <Card header={t('parcel.pvz')}>
          {p.assigned_pvz_name != null ? (
            <Text style={styles.value}>{p.assigned_pvz_name}</Text>
          ) : (
            <Text style={styles.pending}>{t('parcel.pvz_pending')}</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  content: { padding: space[6], gap: space[4] },
  header: { gap: space[3] },
  code: {
    fontSize: type['2xl'].fontSize,
    lineHeight: type['2xl'].lineHeight,
    fontWeight: weight.bold,
    color: role.text.primary,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  rows: { gap: space[3] },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[4] },
  detailLabel: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, color: role.text.secondary },
  detailValue: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    color: role.text.primary,
    fontWeight: weight.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  pending: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, color: role.text.muted },
  value: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    color: role.text.primary,
    fontWeight: weight.medium,
  },
});
