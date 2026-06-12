import { Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, ViewStyle } from 'react-native';
import { role, radius, space, type, weight, TOUCH_MIN } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

/**
 * Button (RN) — comfortable density only: min height 44 (TZ §10). Colors come
 * from the `role` seam, so a future dark theme re-themes it for free.
 */
export function Button({ title, variant = 'primary', fullWidth, disabled, ...rest }: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled ?? undefined}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent' },
        fullWidth && styles.full,
        pressed && !disabled && { backgroundColor: v.pressed ?? v.bg, opacity: v.pressed ? 1 : 0.85 },
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <Text style={[styles.label, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; pressed?: string; border?: string }> = {
  primary: { bg: role.accent.primary, fg: role.accent.onAccent, pressed: role.accent.hover },
  secondary: { bg: role.bg.surface, fg: role.text.primary, border: role.border.default, pressed: role.bg.sunken },
  ghost: { bg: 'transparent', fg: role.accent.primary, pressed: role.accent.subtle },
  danger: { bg: role.intent.danger.fg, fg: role.accent.onAccent },
};

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  } satisfies ViewStyle,
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    fontWeight: weight.semibold,
  },
});
