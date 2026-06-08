/**
 * Disclaimer — the required safety notice. Shown on Welcome, Settings, and the
 * Parent Dashboard. Friendly, non-clinical framing.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { DISCLAIMER } from '../constants';

export default function Disclaimer({ compact }) {
  return (
    <View style={[styles.box, compact && styles.compact]}>
      <Text style={styles.icon}>💛</Text>
      <Text style={styles.text}>{DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    backgroundColor: '#FFF1D6',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  compact: { padding: spacing.sm },
  icon: { fontSize: 18, marginRight: spacing.sm },
  text: { ...typography.caption, color: colors.textSoft, flex: 1, lineHeight: 20 },
});
