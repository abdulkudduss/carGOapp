// RN theme helpers — the native counterpart of the web `--cui-*` layers.
//
// Web maps tokens → CSS vars (role + density seams). React Native has no CSS, so
// components consume @cargo/tokens directly: `role` is the dark-theme seam (a
// future dark theme remaps `role` in the token package, RN re-renders), and only
// the `comfortable` density exists on mobile (touch-first, ≥44px, body ≥16).

import { Platform } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { role, typeScale, space, radius, shadow, fontWeight } from '@cargo/tokens';

export { role, space, radius, fontWeight };

// Mobile is comfortable-only (TZ §10).
export const type = typeScale.comfortable;

// Minimum touch target (TZ §10 — accessibility floor).
export const TOUCH_MIN = 44;

type ShadowToken = (typeof shadow)[keyof typeof shadow];

/**
 * Map a structured shadow token to RN style props. iOS uses shadow*, Android
 * uses elevation (it can't express offset/blur, so we approximate from y+blur).
 */
export function elevation(token: ShadowToken): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: token.color,
      shadowOffset: { width: token.x, height: token.y },
      shadowRadius: token.blur,
      shadowOpacity: token.opacity,
    },
    default: {
      elevation: Math.round(token.y + token.blur / 2),
    },
  })!;
}

// Weight numbers → RN's string union.
export const weight: Record<keyof typeof fontWeight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
