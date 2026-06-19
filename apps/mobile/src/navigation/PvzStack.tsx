// Placeholder home for role=KG_WORKER. The PVZ (ПВЗ) experience isn't built
// yet, so the gate (RootNavigator) routes KG_WORKER here: a single "in
// progress" screen with logout. Kept as a plain component (not a navigator) —
// it's a stub until the PVZ screens land. Logout = clear the token store +
// reset the session, and the gate shows the auth stack again.

import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { tokenStore } from '../api/client';
import { useSessionStore } from '../store/session';

export function PvzStack() {
  const reset = useSessionStore((s) => s.reset);

  const onLogout = async () => {
    await tokenStore.clear();
    reset();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('pvz.placeholder')}</Text>
      </View>
      <Button title={t('nav.logout')} variant="secondary" onPress={onLogout} fullWidth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space[6], gap: space[4], backgroundColor: role.bg.app },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: type.xl.fontSize,
    lineHeight: type.xl.lineHeight,
    fontWeight: weight.bold,
    color: role.text.primary,
    textAlign: 'center',
  },
});
