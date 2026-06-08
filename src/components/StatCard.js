/**
 * StatCard — a single metric tile for the Parent Dashboard.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export default function StatCard({ emoji, value, label, color }) {
  return (
    <View style={[styles.card, { backgroundColor: color || colors.surface }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emoji: { fontSize: 30, marginBottom: spacing.xs },
  value: { ...typography.title, color: colors.text },
  label: { ...typography.caption, color: colors.textSoft, textAlign: 'center', marginTop: 2 },
});
