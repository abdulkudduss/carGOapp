import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { role, radius } from './theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: boolean;
}

/**
 * Skeleton (RN) — pulsing placeholder for loading states (TZ §8.5). Uses the
 * native driver so the pulse runs off the JS thread.
 */
export function Skeleton({ width = '100%', height = 16, rounded }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[styles.base, { width, height, opacity: pulse, borderRadius: rounded ? 999 : radius.sm }]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: role.bg.sunken },
});
