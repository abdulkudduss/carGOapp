// The auth gate. Reads ONLY `status` from the zustand session store — it never
// touches the network itself (TZ requirement). Network-driven session restore
// happens once on mount in a bootstrap effect, which resolves the gate.
//
//   bootstrapping  → splash (checking SecureStore for a refresh token)
//   authenticated  → AuthedArea (loads /me, then routes by role)
//   unauthenticated→ AuthStack (Phone → Code)
//
// Switching the rendered tree on `status` IS the navigation: on logout /
// onAuthFailure the store resets to 'unauthenticated' and this re-renders the
// auth stack — no imperative navigate() needed.
//
// Role routing lives in AuthedArea, a child mounted ONLY in the authenticated
// case — so useMe() (GET /me) never fires on the auth/bootstrap trees where
// there's no access token (a stray 401 would trip the refresh/logout path).

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';
import { useMe } from '../api/hooks';
import { errorToMessage } from '../api/errorToMessage';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { role, space } from '../ui/theme';
import { t } from '../i18n';
import { AuthStack } from './AuthStack';
import { ClientStack } from './ClientStack';
import { PvzStack } from './PvzStack';

export function RootNavigator() {
  const status = useSessionStore((s) => s.status);
  const bootstrapResolved = useSessionStore((s) => s.bootstrapResolved);

  // Cold-start session restore: a persisted refresh token means we can recover a
  // session (the access token was memory-only and is gone). We optimistically go
  // 'authenticated'; AuthedArea's /me query then does the real refresh→retry
  // round-trip and, if the refresh is stale, onAuthFailure kicks us back out.
  useEffect(() => {
    let active = true;
    void (async () => {
      const restorable = await tokenStore.hasRefresh();
      if (active) bootstrapResolved(restorable);
    })();
    return () => {
      active = false;
    };
  }, [bootstrapResolved]);

  if (status === 'bootstrapping') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={role.accent.primary} />
      </View>
    );
  }

  return status === 'authenticated' ? <AuthedArea /> : <AuthStack />;
}

// The authenticated tree: load /me, then route by role. Mounted only when the
// session is authenticated, so the query is scoped to that case.
//   loading → full-screen Skeleton (covers the cold-start refresh round-trip)
//   error   → inline message + Retry + Logout (never a stuck splash)
//   CLIENT     → ClientStack (address, …)
//   KG_WORKER  → PvzStack (placeholder)
//   other      → "no access" stub
function AuthedArea() {
  const me = useMe();
  const setProfile = useSessionStore((s) => s.setProfile);
  const reset = useSessionStore((s) => s.reset);

  // Mirror the session-derived context for synchronous reads (canonical copy
  // stays in the /me query cache — TZ §8 split).
  useEffect(() => {
    if (me.data) {
      setProfile({ role: me.data.role ?? null, maskedRoom: me.data.maskedRoom ?? null });
    }
  }, [me.data, setProfile]);

  const onLogout = async () => {
    await tokenStore.clear();
    reset();
  };

  if (me.isPending) {
    return (
      <View style={styles.center}>
        <View style={styles.lines}>
          <Skeleton width={200} height={22} />
          <Skeleton width={160} height={22} />
        </View>
      </View>
    );
  }

  if (me.isError) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={errorToMessage(me.error)}
          icon="📦"
          action={
            <View style={styles.lines}>
              <Button title={t('common.retry')} variant="secondary" onPress={() => me.refetch()} />
              <Button title={t('nav.logout')} variant="ghost" onPress={onLogout} />
            </View>
          }
        />
      </View>
    );
  }

  switch (me.data.role) {
    case 'CLIENT':
      return <ClientStack />;
    case 'KG_WORKER':
      return <PvzStack />;
    default:
      return (
        <View style={styles.center}>
          <EmptyState
            title={t('noAccess.title')}
            description={t('noAccess.description')}
            icon="🚫"
            action={<Button title={t('nav.logout')} variant="secondary" onPress={onLogout} />}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
  lines: { gap: space[3], alignItems: 'center' },
});
