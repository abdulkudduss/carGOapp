import { Text, View } from 'react-native';
import { tokens } from '@cargo/tokens';

// The import of @cargo/tokens above is the proof that cross-package wiring works
// on the mobile (React Native / Expo) platform. Nothing here is product UI.
export default function App() {
  return (
    <View>
      <Text>CARGO Mobile</Text>
      <Text>Design tokens loaded: {Object.keys(tokens).length} keys</Text>
    </View>
  );
}
