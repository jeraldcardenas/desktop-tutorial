/**
 * Screen — consistent safe-area + padded background wrapper for every screen.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function Screen({ children, scroll = false, center = false, style }) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.md,
  };

  if (scroll) {
    return (
      <View style={styles.bg}>
        <ScrollView
          contentContainerStyle={[styles.content, pad, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.bg, styles.content, pad, center && styles.center, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
});
