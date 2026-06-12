import { StyleSheet, Text, View } from 'react-native';
import { radius, space, type, weight } from './theme';

// Internal RN badge shell. Not exported — callers use StatusBadge / ClaimBadge
// so the two axes can never be mixed (TZ §3/§12).
export function BadgeBase({ bg, fg, border, label }: { bg: string; fg: string; border?: string; label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border ?? 'transparent' }]}>
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    fontWeight: weight.semibold,
  },
});
