// PreAlertListScreen — the client's pre-alerts (TZ §6.5): parcels announced in
// advance by track number so they auto-match on arrival. List + create + cancel
// live on this one screen; the create form is a BottomSheet (short form, a
// separate route would be overkill). Reuses usePreAlerts/useCreatePreAlert/
// useDeletePreAlert; the hooks invalidate the list on success, so the screen
// never re-fetches by hand.
//
// States (§8.5): loading → 3 skeleton cards; error → EmptyState + Retry; empty →
// EmptyState + «Создать»; data → FlatList of cards.
//
// `status` arrives from the server (ACTIVE | MATCHED | CANCELLED) — never
// computed here. DELETE is a SOFT delete (→ CANCELLED, the row stays in the
// list), so we hide CANCELLED rows: a cancelled pre-alert is, to the user, gone.
//
// CATEGORY: the form needs `category_id` (int64 FK); the list carries only the
// id. Both come from useCategories() (GET /api/v1/categories) — id → name_ru. (An
// earlier build hardcoded these because the endpoint didn't exist yet; it now
// does, so the picker and the card labels share one server source.)

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { color } from '@cargo/tokens';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BottomSheet } from '../ui/BottomSheet';
import { useToast } from '../ui/Toast';
import { role, radius, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { isApiError } from '@cargo/api';
import { errorToMessage } from '../api/errorToMessage';
import { usePreAlerts, useCreatePreAlert, useDeletePreAlert, useCategories } from '../api/hooks';

// Server-owned pre-alert statuses we render (CANCELLED is filtered out before
// rendering, so it needs no label). Anything unknown shows no badge.
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: t('prealert.status_active'),
  MATCHED: t('prealert.status_matched'),
};
const STATUS_TONE: Record<string, string> = {
  ACTIVE: color.warning[600],
  MATCHED: color.success[600],
};

function errorCode(e: unknown): string | null {
  return isApiError(e) ? e.code : null;
}

const schema = z.object({
  track_number: z.string().trim().min(1, t('prealert.v_track')),
  shop_name: z.string().trim().min(1, t('prealert.v_shop')),
  // 0 = nothing picked yet (no real category has id 0); positive() turns the
  // empty selection into the «выберите категорию» message on submit.
  category_id: z.number().int().positive(t('prealert.v_category')),
  // Kept as a string from the numeric keyboard; coerced to a number on submit.
  declared_value: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, t('prealert.v_value')),
});
type FormValues = z.infer<typeof schema>;

export function PreAlertListScreen() {
  const { toast } = useToast();
  const preAlerts = usePreAlerts();
  const categories = useCategories();
  const create = useCreatePreAlert();
  const remove = useDeletePreAlert();

  // category_id → RU name, for resolving the id the list/cards carry.
  const categoryName = useMemo(
    () => new Map((categories.data ?? []).flatMap((c) => (c.id != null ? [[c.id, c.name_ru ?? c.code ?? String(c.id)] as const] : []))),
    [categories.data],
  );

  const [formOpen, setFormOpen] = useState(false);
  // Errors raised while the sheet is open are shown INLINE, not via toast: the
  // sheet is a native Modal (its own window), so a toast fired behind it would be
  // occluded — and the duplicate case deliberately keeps the sheet open.
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { track_number: '', shop_name: '', category_id: 0, declared_value: '' },
  });

  const openForm = () => {
    reset();
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    create.mutate(
      {
        track_number: values.track_number.trim(),
        shop_name: values.shop_name.trim(),
        category_id: values.category_id,
        declared_value: Number(values.declared_value),
      },
      {
        onSuccess: () => {
          // The sheet closes first, so this toast lands on the list (visible).
          setFormOpen(false);
          reset();
          toast({ title: t('prealert.created_success'), variant: 'success' });
        },
        onError: (e) => {
          // A duplicate active track is a typed business answer — pin it to the
          // track field and KEEP the sheet open so the user can fix it (never
          // «Ошибка 409»). Any other failure → a general inline line in the sheet.
          if (errorCode(e) === 'PRE_ALERT_DUPLICATE') {
            setError('track_number', { message: t('prealert.duplicate_track') });
          } else {
            setFormError(errorToMessage(e));
          }
        },
      },
    );
  });

  const confirmDelete = (id: number) => {
    Alert.alert(t('prealert.delete_confirm_title'), t('prealert.delete_confirm_message'), [
      { text: t('prealert.cancel'), style: 'cancel' },
      {
        text: t('prealert.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => toast({ title: t('prealert.deleted_success'), variant: 'success' }),
            onError: (e) => toast({ title: errorToMessage(e), variant: 'danger' }),
          }),
      },
    ]);
  };

  if (preAlerts.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <View style={styles.cardLines}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
                <Skeleton width="50%" height={16} />
              </View>
            </Card>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (preAlerts.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          title={t('prealert.error')}
          icon="📦"
          action={<Button title={t('common.retry')} variant="secondary" onPress={() => preAlerts.refetch()} />}
        />
      </SafeAreaView>
    );
  }

  // Hide soft-deleted (CANCELLED) rows — to the user a cancelled pre-alert is gone.
  const items = (preAlerts.data ?? []).filter((p) => p.status !== 'CANCELLED');

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={preAlerts.isRefetching} onRefresh={() => preAlerts.refetch()} />
        }
        ListEmptyComponent={
          <EmptyState
            title={t('prealert.empty')}
            icon="📦"
            action={<Button title={t('prealert.create')} onPress={openForm} />}
          />
        }
        renderItem={({ item }) => {
          const status = item.status ?? '';
          const label = STATUS_LABEL[status];
          const itemCategory = item.category_id != null ? categoryName.get(item.category_id) : undefined;
          const canDelete = status === 'ACTIVE';
          return (
            <Card>
              <View style={styles.cardLines}>
                <View style={styles.rowBetween}>
                  <Text style={styles.code}>{item.track_number}</Text>
                  {label && (
                    <View style={[styles.badge, { borderColor: STATUS_TONE[status] }]}>
                      <Text style={[styles.badgeText, { color: STATUS_TONE[status] }]}>{label}</Text>
                    </View>
                  )}
                </View>

                {item.shop_name != null && (
                  <Text style={styles.muted}>
                    {t('prealert.shop_name')}: {item.shop_name}
                  </Text>
                )}
                {itemCategory != null && (
                  <Text style={styles.muted}>
                    {t('prealert.category')}: {itemCategory}
                  </Text>
                )}
                {item.declared_value != null && (
                  <Text style={styles.muted}>
                    {t('prealert.estimated_value')}: {item.declared_value} {item.currency ?? ''}
                  </Text>
                )}

                {canDelete && (
                  <View style={styles.action}>
                    <Button
                      title={t('prealert.delete')}
                      variant="danger"
                      onPress={() => confirmDelete(item.id!)}
                      disabled={remove.isPending}
                    />
                  </View>
                )}
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footerAction}>
              <Button title={t('prealert.create')} fullWidth onPress={openForm} />
            </View>
          ) : null
        }
      />

      <BottomSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t('prealert.create_title')}
        footer={
          <>
            <View style={styles.footerBtn}>
              <Button
                title={t('prealert.cancel')}
                variant="secondary"
                fullWidth
                onPress={() => setFormOpen(false)}
                disabled={create.isPending}
              />
            </View>
            <View style={styles.footerBtn}>
              <Button
                title={create.isPending ? t('common.loading') : t('prealert.submit')}
                fullWidth
                onPress={onSubmit}
                disabled={create.isPending}
              />
            </View>
          </>
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Controller
            control={control}
            name="track_number"
            render={({ field }) => (
              <Input
                label={t('prealert.track_number')}
                placeholder={t('prealert.track_placeholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.track_number?.message}
                editable={!create.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="shop_name"
            render={({ field }) => (
              <Input
                label={t('prealert.shop_name')}
                placeholder={t('prealert.shop_placeholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.shop_name?.message}
                editable={!create.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('prealert.category')}</Text>
                {categories.isPending ? (
                  <Skeleton width="100%" height={36} />
                ) : categories.isError ? (
                  <View style={styles.rowBetween}>
                    <Text style={styles.fieldError}>{t('prealert.category_error')}</Text>
                    <Button title={t('common.retry')} variant="secondary" onPress={() => categories.refetch()} />
                  </View>
                ) : (
                  <View style={styles.options}>
                    {(categories.data ?? []).map((c) => {
                      if (c.id == null) return null;
                      const selected = field.value === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          disabled={create.isPending}
                          onPress={() => field.onChange(c.id)}
                          style={[styles.option, selected && styles.optionSelected]}
                        >
                          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                            {c.name_ru ?? c.code}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {errors.category_id?.message && <Text style={styles.fieldError}>{errors.category_id.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="declared_value"
            render={({ field }) => (
              <Input
                label={t('prealert.estimated_value')}
                placeholder={t('prealert.estimated_value_placeholder')}
                keyboardType="numeric"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.declared_value?.message}
                editable={!create.isPending}
              />
            )}
          />

          {formError && <Text style={styles.fieldError}>{formError}</Text>}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  list: { padding: space[6], gap: space[4], flexGrow: 1 },
  cardLines: { gap: space[2] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  action: { marginTop: space[2] },
  footerAction: { marginTop: space[4] },
  footerBtn: { flex: 1 },
  code: {
    fontSize: type.lg.fontSize,
    lineHeight: type.lg.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
    flexShrink: 1,
  },
  muted: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, fontWeight: weight.semibold },
  // Form
  form: { gap: space[4] },
  field: { gap: space[1] },
  fieldLabel: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    fontWeight: weight.medium,
    color: role.text.secondary,
  },
  fieldError: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.intent.danger.fg },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  option: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: role.border.default,
    backgroundColor: role.bg.surface,
  },
  optionSelected: { borderColor: role.accent.primary, backgroundColor: role.accent.subtle },
  optionText: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.secondary },
  optionTextSelected: { color: role.accent.primary, fontWeight: weight.semibold },
});
