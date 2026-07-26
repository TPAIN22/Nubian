import { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './Text';
import {
  controlHeight,
  iconSize,
  radius,
  spacing,
  typography,
  withAlpha,
} from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export type InputState = 'default' | 'error' | 'success';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Helper copy under the field. Replaced by `error` when one is present. */
  hint?: string;
  error?: string;
  success?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing glyph. Ignored when the field is a password (the eye wins). */
  iconRight?: keyof typeof Ionicons.glyphMap;
  onIconRightPress?: () => void;
  /** Renders a show/hide toggle and manages `secureTextEntry` itself. */
  isPassword?: boolean;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

/**
 * The app's text field.
 *
 * Focus is expressed with a brand ring rather than a colour swap, so the field
 * doesn't jump when it gains focus. Validation state is carried on the border
 * *and* in a message line, never colour alone — a red border on its own is
 * invisible to a large share of users.
 *
 * The message row reserves its height once `hint`/`error`/`success` is possible,
 * so a form doesn't reflow the moment validation fires.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    success,
    icon,
    iconRight,
    onIconRightPress,
    isPassword = false,
    required = false,
    editable = true,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);

  const state: InputState = error ? 'error' : success ? 'success' : 'default';

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const { borderColor, ringColor, fillColor } = useMemo(() => {
    if (!editable) {
      return {
        borderColor: colors.border,
        ringColor: 'transparent',
        fillColor: colors.surfaceMuted,
      };
    }
    if (state === 'error') {
      return {
        borderColor: colors.error,
        ringColor: focused ? withAlpha(colors.error, 0.14) : 'transparent',
        fillColor: colors.surface,
      };
    }
    if (state === 'success') {
      return {
        borderColor: colors.success,
        ringColor: focused ? withAlpha(colors.success, 0.14) : 'transparent',
        fillColor: colors.surface,
      };
    }
    return {
      borderColor: focused ? colors.borderFocus : colors.border,
      ringColor: focused ? withAlpha(colors.primary, 0.14) : 'transparent',
      fillColor: focused ? colors.surface : colors.surfaceMuted,
    };
  }, [state, focused, editable, colors]);

  const message = error ?? success ?? hint;
  const messageTone = error ? 'error' : success ? 'success' : 'muted';
  const trailingIcon = isPassword
    ? ((secure ? 'eye-outline' : 'eye-off-outline') as keyof typeof Ionicons.glyphMap)
    : iconRight;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" tone="body" style={styles.label}>
          {label}
          {required ? (
            <AppText variant="label" tone="error">
              {' *'}
            </AppText>
          ) : null}
        </AppText>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: fillColor,
            borderColor,
            // A 3px ring instead of a thicker border: the field geometry never
            // shifts between focused and blurred.
            shadowColor: ringColor === 'transparent' ? 'transparent' : borderColor,
          },
          focused ? { borderWidth: 1.5 } : null,
          inputStyle,
        ]}
      >
        {ringColor !== 'transparent' ? (
          <View
            pointerEvents="none"
            style={[styles.ring, { borderColor: ringColor }]}
          />
        ) : null}

        {icon ? (
          <Ionicons
            name={icon}
            size={iconSize.md}
            color={focused ? colors.primary : colors.text.subtle}
          />
        ) : null}

        <TextInput
          ref={ref}
          editable={editable}
          secureTextEntry={secure}
          placeholderTextColor={colors.text.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            typography.body,
            { color: editable ? colors.text.title : colors.text.disabled },
          ]}
          {...rest}
        />

        {trailingIcon ? (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              isPassword ? (secure ? 'Show password' : 'Hide password') : 'Field action'
            }
            onPress={isPassword ? () => setSecure((s) => !s) : onIconRightPress}
          >
            <Ionicons name={trailingIcon} size={iconSize.md} color={colors.text.muted} />
          </Pressable>
        ) : state === 'success' ? (
          <Ionicons name="checkmark-circle" size={iconSize.md} color={colors.success} />
        ) : null}
      </View>

      {message ? (
        <View style={styles.messageRow}>
          {state !== 'default' ? (
            <Ionicons
              name={state === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={iconSize.xs}
              color={state === 'error' ? colors.error : colors.success}
            />
          ) : null}
          <AppText variant="caption" tone={messageTone} style={styles.messageText}>
            {message}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { marginBottom: spacing.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlHeight.lg,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderRadius: radius.input,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.input,
    borderWidth: 3,
    margin: -3,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    // Android adds asymmetric leading otherwise, which knocks the text off
    // centre inside a fixed-height field.
    includeFontPadding: false,
  },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  messageText: { flex: 1 },
});
