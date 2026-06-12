import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { role, radius, space, type, weight, TOUCH_MIN } from './theme';

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
}

/**
 * Input (RN) — label / hint / error, forwards its ref. Presentation only (no
 * validation). Focus ring uses the `role.focus` token.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, mono, style, onFocus, onBlur, editable, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);
  const borderColor = invalid ? role.intent.danger.fg : focused ? role.focus : role.border.default;

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        editable={editable}
        placeholderTextColor={role.text.muted}
        style={[
          styles.input,
          { borderColor, color: editable === false ? role.text.muted : role.text.primary },
          focused && { borderWidth: 2 },
          mono && styles.mono,
          editable === false && { backgroundColor: role.bg.sunken },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: space[1] },
  label: {
    fontSize: type.sm.fontSize,
    lineHeight: type.sm.lineHeight,
    fontWeight: weight.medium,
    color: role.text.secondary,
  },
  input: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: type.md.fontSize,
    lineHeight: type.md.lineHeight,
    backgroundColor: role.bg.surface,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  mono: { fontFamily: 'monospace', letterSpacing: 0.5 },
  hint: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted },
  error: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.intent.danger.fg },
});
