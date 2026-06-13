// AuthedScreen — NOT the real home. It only proves the login loop closed: it
// reads GET /me and shows role + masked room, plus a logout button. The real
// home ("Мой адрес в Японии", parcels, claim, …) is built by the frontender on
// these same patterns.
//
// This screen demonstrates the §8.5 rule every screen must follow: handle
// loading and error explicitly.
//   • loading → Skeleton (this also covers the cold-start refresh round-trip:
//     /me with a stale/absent access token → 401 → single-flight refresh → retry).
//   • error   → inline message (errorToMessage) + Retry, no crash.
//   • success → mirror role/maskedRoom into zustand (session-derived bits only;
//     the full MeResponse stays in the query cache — single source of truth).
//
// /me lives in TanStack Query (server data); the auth flag lives in zustand
// (session). Logout clears the token store + session → the gate shows the auth
// stack again.

import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { useMe } from '../api/hooks';
import { errorToMessage } from '../api/errorToMessage';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';

export function AuthedScreen() {
  const me = useMe();
  const setProfile = useSessionStore((s) => s.setProfile);
  const reset = useSessionStore((s) => s.reset);

  // Mirror only the session-derived context once /me resolves.
  useEffect(() => {
    if (me.data) {
      setProfile({ role: me.data.role ?? null, maskedRoom: me.data.maskedRoom ?? null });
    }
  }, [me.data, setProfile]);

  const onLogout = async () => {
    await tokenStore.clear();
    reset();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('authed.title')}</Text>

        {me.isPending ? (
          <View style={styles.lines}>
            <Skeleton width={180} height={22} />
            <Skeleton width={140} height={22} />
          </View>
        ) : me.isError ? (
          <View style={styles.lines}>
            <Text style={styles.error}>{errorToMessage(me.error)}</Text>
            <Button title={t('common.retry')} variant="secondary" onPress={() => me.refetch()} />
          </View>
        ) : (
          <View style={styles.lines}>
            <Text style={styles.line}>{t('authed.role', { role: me.data?.role ?? '—' })}</Text>
            <Text style={styles.line}>
              {me.data?.maskedRoom
                ? t('authed.room', { room: me.data.maskedRoom })
                : t('authed.noRoom')}
            </Text>
          </View>
        )}
      </View>

      <Button title={t('authed.logout')} variant="secondary" onPress={onLogout} fullWidth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space[6], gap: space[4], backgroundColor: role.bg.app },
  body: { flex: 1, justifyContent: 'center', gap: space[4] },
  lines: { gap: space[2] },
  title: {
    fontSize: type['2xl'].fontSize,
    lineHeight: type['2xl'].lineHeight,
    fontWeight: weight.bold,
    color: role.text.primary,
  },
  line: {
    fontSize: type.lg.fontSize,
    lineHeight: type.lg.lineHeight,
    color: role.text.secondary,
  },
  error: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    color: role.intent.danger.fg,
  },
});
