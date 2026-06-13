// CodeScreen — step 2 of OTP login (TZ §6.1). Reference patterns:
//   • 6-digit code via RHF + zod (<Controller>, same as PhoneScreen).
//   • Verify = TanStack mutation; Button shows a loader while pending.
//   • Resend countdown is driven by the SERVER value (route param retryAfterSec),
//     NOT a hardcoded timer. "Отправить снова" is disabled until it hits 0; a
//     successful resend resets the countdown from the fresh server value.
//   • On success: store the token pair → flip the session to authed. The gate
//     (RootNavigator) then renders AuthedScreen, which owns the /me query — we do
//     NOT fetch /me here, so the authed screen can show its loading state (§8.5).
//   • Wrong code → INVALID_OTP (HTTP 400) → inline message via errorToMessage,
//     no crash, user can retry. We map the CODE, not the status (§8.2).

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { useRequestOtp, useVerifyOtp } from '../api/hooks';
import { errorToMessage } from '../api/errorToMessage';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';
import type { AuthScreenProps } from '../navigation/types';

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, t('validation.codeLength')),
});
type FormValues = z.infer<typeof schema>;

export function CodeScreen({ route }: AuthScreenProps<'Code'>) {
  const { phone, retryAfterSec } = route.params;
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const signedIn = useSessionStore((s) => s.signedIn);

  // Server-driven resend countdown. Seeded from the request response; reset on
  // every successful resend. The client never invents the duration (TZ §6.1).
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSec);

  // Re-schedules one tick per remaining second; stops at 0. Keyed on the value so
  // exhaustive-deps is satisfied and resend (which raises secondsLeft) restarts it.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = handleSubmit(({ code }) => {
    verifyOtp.mutate(
      { phone, code },
      {
        onSuccess: async (pair) => {
          // setTokens persists refresh (SecureStore) + holds access in memory.
          await tokenStore.setTokens({
            accessToken: pair.accessToken ?? '',
            refreshToken: pair.refreshToken ?? '',
          });
          signedIn(); // gate → AuthedScreen, which loads /me
        },
      },
    );
  });

  const onResend = () => {
    requestOtp.mutate(
      { phone },
      { onSuccess: (sec) => setSecondsLeft(sec) },
    );
  };

  const canResend = secondsLeft <= 0 && !requestOtp.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('code.title')}</Text>
      <Text style={styles.subtitle}>{t('code.subtitle', { phone })}</Text>

      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <Input
            label={t('code.label')}
            placeholder={t('code.placeholder')}
            keyboardType="number-pad"
            maxLength={6}
            mono
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.code?.message}
            editable={!verifyOtp.isPending}
          />
        )}
      />

      {verifyOtp.isError && <Text style={styles.formError}>{errorToMessage(verifyOtp.error)}</Text>}

      <Button
        title={verifyOtp.isPending ? t('common.loading') : t('code.submit')}
        onPress={onSubmit}
        disabled={verifyOtp.isPending}
        fullWidth
      />

      <Button
        title={canResend ? t('code.resend') : t('code.resendIn', { sec: secondsLeft })}
        variant="ghost"
        onPress={onResend}
        disabled={!canResend}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space[6], gap: space[4], backgroundColor: role.bg.app },
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
