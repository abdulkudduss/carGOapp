// The unauthenticated stack: PhoneScreen → CodeScreen. Shown by the gate
// (RootNavigator) whenever there is no session.

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhoneScreen } from '../screens/PhoneScreen';
import { CodeScreen } from '../screens/CodeScreen';
import { role } from '../ui/theme';
import { t } from '../i18n';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: role.bg.surface },
        headerTintColor: role.text.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: role.bg.app },
      }}
    >
      <Stack.Screen name="Phone" component={PhoneScreen} options={{ title: t('phone.title') }} />
      <Stack.Screen name="Code" component={CodeScreen} options={{ title: t('code.title') }} />
    </Stack.Navigator>
  );
}
