// The auth gate. Reads ONLY `status` from the zustand session store — it never
// touches the network itself (TZ requirement). Network-driven session restore
// happens once on mount in a bootstrap effect, which resolves the gate.
//
//   bootstrapping  → splash (checking SecureStore for a refresh token)
//   authenticated  → AuthedScreen (the login-loop proof; real home is built later)
//   unauthenticated→ AuthStack (Phone → Code)
//
// Switching the rendered tree on `status` IS the navigation: on logout /
// onAuthFailure the store resets to 'unauthenticated' and this re-renders the
// auth stack — no imperative navigate() needed.

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';
import { role } from '../ui/theme';
import { AuthStack } from './AuthStack';
import { AuthedScreen } from '../screens/AuthedScreen';

export function RootNavigator() {
  const status = useSessionStore((s) => s.status);
  const bootstrapResolved = useSessionStore((s) => s.bootstrapResolved);

  // Cold-start session restore: a persisted refresh token means we can recover a
  // session (the access token was memory-only and is gone). We optimistically go
  // 'authenticated'; AuthedScreen's /me query then does the real refresh→retry
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

  return status === 'authenticated' ? <AuthedScreen /> : <AuthStack />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: role.bg.app },
});
