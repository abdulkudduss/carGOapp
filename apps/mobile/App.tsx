// App root: the provider stack every screen relies on, then the auth gate.
//
//   QueryClientProvider  → TanStack Query: ALL server data (TZ §8 split).
//   SafeAreaProvider     → safe-area insets for notches/home indicators.
//   ToastProvider        → app-wide toast queue (useToast); renders a bottom
//                          overlay above the nav tree.
//   NavigationContainer  → React Navigation tree.
//   RootNavigator        → auth gate (reads zustand session, not the network).
//
// (The RN component showcase from step 3 still lives in src/Showcase.tsx for
// reference; the app entry is now the real OTP-login scaffold.)

import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastProvider } from './src/ui/Toast';
import { role } from './src/ui/theme';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={role.bg.app} />
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
