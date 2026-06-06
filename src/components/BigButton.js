/**
 * BigButton — large, high-contrast, toddler-and-parent friendly touch target.
 * Variants: primary, success ("Done"), neutral ("Skip"), ghost.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.textOnPrimary },
  success: { bg: colors.success, fg: colors.textOnPrimary },
  neutral: { bg: colors.neutral, fg: colors.text },
  ghost: { bg: 'transparent', fg: colors.textSoft },
};

export default function BigButton({
  label,
  emoji,
  onPress,
  variant = 'primary',
  style,
  disabled,
  small,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: v.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      <View style={styles.row}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text style={[styles.label, small && styles.labelSmall, { color: v.fg }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  small: { minHeight: 52, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  ghost: { shadowOpacity: 0, elevation: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26, marginRight: spacing.sm },
  label: { ...typography.button, textAlign: 'center' },
  labelSmall: { fontSize: 18 },
});
