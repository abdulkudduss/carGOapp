import { StyleSheet, Text, View } from 'react-native';
import { badgeStatus, space, radius, typeScale } from '@cargo/tokens';

// Proof that @cargo/tokens is consumed natively in React Native: a handful of
// `status` badge colors rendered as squares straight from the shared token map.
// Not a full showcase (that lives in web-ops) — just real RN consumption.
const SWATCHES: Array<keyof typeof badgeStatus> = ['AT_JP', 'SHIPPED', 'DONE', 'LOST'];

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>CARGO · @cargo/tokens в React Native</Text>
      <View style={styles.row}>
        {SWATCHES.map((code) => {
          const c = badgeStatus[code];
          return (
            <View key={code} style={[styles.swatch, { backgroundColor: c.bg }]}>
              <Text style={[styles.swatchLabel, { color: c.text }]}>{code}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: space[6],
    gap: space[4],
    justifyContent: 'center',
  },
  title: {
    fontSize: typeScale.comfortable.md.fontSize,
    lineHeight: typeScale.comfortable.md.lineHeight,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  swatch: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: typeScale.comfortable.xs.fontSize,
    fontWeight: '600',
  },
});
