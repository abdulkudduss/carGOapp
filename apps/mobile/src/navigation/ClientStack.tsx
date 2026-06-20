// The authenticated stack for role=CLIENT. Shown by the gate (RootNavigator)
// once /me resolves to a CLIENT. Modelled on AuthStack. Screens:
//   Address → ParcelList → ParcelDetail (TZ §3 / §6.2), plus TrackSearch (§6.4).
// The Address screen carries a header link to ParcelList (the entry into the
// parcels flow); ParcelList rows push ParcelDetail with the parcel id, and its
// header links to TrackSearch (lookup of an UNCLAIMED parcel by track number).

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { AddressScreen } from '../screens/AddressScreen';
import { ParcelListScreen } from '../screens/ParcelListScreen';
import { ParcelDetailScreen } from '../screens/ParcelDetailScreen';
import { TrackSearchScreen } from '../screens/TrackSearchScreen';
import { PreAlertListScreen } from '../screens/PreAlertListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import type { ClientStackParamList } from './types';

const Stack = createNativeStackNavigator<ClientStackParamList>();

export function ClientStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: role.bg.surface },
        headerTintColor: role.text.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: role.bg.app },
      }}
    >
      <Stack.Screen
        name="Address"
        component={AddressScreen}
        options={({ navigation }) => ({
          title: t('address.title'),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: space[4] }}>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => navigation.navigate('PreAlertList')}
              >
                <Text style={{ color: role.accent.primary, fontSize: type.md.fontSize, fontWeight: weight.semibold }}>
                  {t('prealert.open')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => navigation.navigate('ParcelList')}
              >
                <Text style={{ color: role.accent.primary, fontSize: type.md.fontSize, fontWeight: weight.semibold }}>
                  {t('parcels.title')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.open')}
                hitSlop={8}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={{ color: role.accent.primary, fontSize: type.lg.fontSize }}>👤</Text>
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="ParcelList"
        component={ParcelListScreen}
        options={({ navigation }) => ({
          title: t('parcels.title'),
          // Entry into the track-search flow (TZ §6.4): an UNCLAIMED parcel never
          // appears in the list, so its only reachable point is this lookup.
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate('TrackSearch')}
            >
              <Text style={{ color: role.accent.primary, fontSize: type.md.fontSize, fontWeight: weight.semibold }}>
                {t('track.title')}
              </Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="ParcelDetail" component={ParcelDetailScreen} options={{ title: t('parcel.title') }} />
      <Stack.Screen name="TrackSearch" component={TrackSearchScreen} options={{ title: t('track.title') }} />
      <Stack.Screen name="PreAlertList" component={PreAlertListScreen} options={{ title: t('prealert.title') }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile.title') }} />
    </Stack.Navigator>
  );
}
