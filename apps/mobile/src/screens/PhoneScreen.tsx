// PhoneScreen — step 1 of OTP login (TZ §6.1). Reference patterns the frontender
// copies:
//   • Form = react-hook-form + zod (zodResolver). RN inputs are bound via
//     <Controller> — NOT register() (register emits web DOM props; RN TextInput
//     speaks onChangeText). This is the canonical form binding for this app.
//   • Submit = a TanStack mutation (useRequestOtp). Button shows a loader while
//     pending; server errors render inline via errorToMessage (never a toast of
//     "Ошибка 4xx").
//   • The resend cooldown is taken from the SERVER response and passed to the
//     next screen — never computed on the client (TZ §6.1, §8).
//   • Every string goes through t().

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { useRequestOtp } from '../api/hooks';
import { errorToMessage } from '../api/errorToMessage';
import type { AuthScreenProps } from '../navigation/types';

// 12 digits, leading 996 (Kyrgyzstan). Server is the final authority; this is a
// fast client-side format gate so we don't spend an SMS on an obvious typo.
// NOTE: t() here runs at module load, so messages bake in the locale active then
// (RU today — KG falls back to RU regardless). If validation text ever needs to
// react to a runtime locale switch, build the schema inside the component.
const schema = z.object({
  phone: z
    .string()
    .min(1, t('validation.phoneRequired'))
    .regex(/^996\d{9}$/, t('validation.phoneFormat')),
});
type FormValues = z.infer<typeof schema>;

export function PhoneScreen({ navigation }: AuthScreenProps<'Phone'>) {
  const requestOtp = useRequestOtp();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(({ phone }) => {
    requestOtp.mutate(
      { phone },
      {
        onSuccess: (retryAfterSec) => navigation.navigate('Code', { phone, retryAfterSec }),
        // error is rendered below from requestOtp.error — no throw, no crash.
      },
    );
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('phone.title')}</Text>
        <Text style={styles.subtitle}>{t('phone.subtitle')}</Text>

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              label={t('phone.label')}
              placeholder={t('phone.placeholder')}
              keyboardType="phone-pad"
              autoFocus
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
              editable={!requestOtp.isPending}
            />
          )}
        />

        {requestOtp.isError && <Text style={styles.formError}>{errorToMessage(requestOtp.error)}</Text>}

        <Button
          title={requestOtp.isPending ? t('common.loading') : t('phone.submit')}
          onPress={onSubmit}
          disabled={requestOtp.isPending}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: role.bg.app },
  container: { padding: space[6], gap: space[4] },
  title: {
    fontSize: type.xl.fontSize,
    lineHeight: type.xl.lineHeight,
    fontWeight: weight.bold,
    color: role.text.primary,
  },
  subtitle: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    color: role.text.secondary,
  },
  formError: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    color: role.intent.danger.fg,
  },
});
