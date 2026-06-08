import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Buddy from '../components/Buddy';
import BigButton from '../components/BigButton';
import { CATEGORIES } from '../constants';
import { colors, radius, spacing, typography } from '../theme';
import { speak } from '../services/speech';
import { useSession } from '../context/SessionContext';

export default function ProgressSummaryScreen({ navigation }) {
  const { session, finishSession } = useSession();
  // Snapshot the session's results before it is cleared by finishSession.
  const [summary] = useState(() => {
    const completed = session?.completed || [];
    const skills = {};
    for (const m of completed) {
      const label = CATEGORIES[m.category]?.label || m.category;
      const emoji = CATEGORIES[m.category]?.emoji || '⭐';
      skills[label] = skills[label] || { emoji, count: 0 };
      skills[label].count += 1;
    }
    return { done: completed.length, skipped: session?.skipped || 0, skills };
  });
  const finished = useRef(false);

  useEffect(() => {
    if (!finished.current) {
      finished.current = true;
      finishSession();
    }
    speak(`You finished your adventure! You completed ${summary.done} missions. Amazing work!`);
  }, []);

  const skillEntries = Object.entries(summary.skills);

  return (
    <Screen scroll center>
      <Buddy mood="cheer" size={130} />
      <Text style={styles.title}>Adventure Complete!</Text>
      <Text style={styles.subtitle}>
        You finished {summary.done} mission{summary.done === 1 ? '' : 's'}! 🎉
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Skills practiced today</Text>
        {skillEntries.length === 0 ? (
          <Text style={styles.empty}>Come back soon for more fun!</Text>
        ) : (
          skillEntries.map(([label, info]) => (
            <View key={label} style={styles.skillRow}>
              <Text style={styles.skillEmoji}>{info.emoji}</Text>
              <Text style={styles.skillLabel}>{label}</Text>
              <Text style={styles.skillCount}>×{info.count}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <BigButton
          label="Play Again"
          emoji="🔁"
          variant="primary"
          onPress={() => navigation.navigate('AgeSelection')}
        />
        <BigButton
          label="Home"
          emoji="🏠"
          variant="neutral"
          small
          style={{ marginTop: spacing.sm }}
          onPress={() => navigation.popToTop()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.primaryDark, marginTop: spacing.md },
  subtitle: { ...typography.body, color: colors.textSoft, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textSoft },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  skillEmoji: { fontSize: 24, marginRight: spacing.md },
  skillLabel: { ...typography.body, color: colors.text, flex: 1 },
  skillCount: { ...typography.body, color: colors.primaryDark, fontWeight: '800' },
  actions: { width: '100%', marginTop: spacing.xl },
});
