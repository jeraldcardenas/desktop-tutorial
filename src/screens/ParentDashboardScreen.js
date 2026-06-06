import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import Disclaimer from '../components/Disclaimer';
import { THEMES } from '../constants';
import { colors, radius, spacing, typography } from '../theme';
import { useSession } from '../context/SessionContext';
import { favoriteTheme, weekStart } from '../services/storage';

export default function ParentDashboardScreen() {
  const { progress } = useSession();

  const favId = favoriteTheme(progress);
  const fav = THEMES.find((t) => t.id === favId);
  const thisWeek = progress.weekly?.[weekStart()] || { sessions: 0, missions: 0 };

  return (
    <Screen scroll>
      <Text style={styles.title}>Parent Dashboard</Text>
      <Text style={styles.subtitle}>Skills practiced — celebrate the wins! 🎉</Text>

      <View style={styles.grid}>
        <StatCard emoji="🎒" value={progress.sessionsCompleted} label="Sessions completed" color="#E9F7F7" />
        <StatCard emoji="💬" value={progress.words} label="Words practiced" color="#FFF1D6" />
        <StatCard emoji="🤸" value={progress.movement} label="Movement activities" color="#EAF6E7" />
        <StatCard emoji="🎭" value={progress.imitation} label="Imitation activities" color="#F1ECFB" />
        <StatCard emoji="🤝" value={progress.social} label="Social interactions" color="#FDE9E5" />
        <StatCard emoji="🧠" value={progress.cognitive} label="Thinking activities" color="#E6F3FA" />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Favorite adventure</Text>
        <Text style={styles.bannerValue}>
          {fav ? `${fav.emoji}  ${fav.label}` : 'Play to discover!'}
        </Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>This week's progress</Text>
        <Text style={styles.bannerValue}>
          {thisWeek.sessions} session{thisWeek.sessions === 1 ? '' : 's'} ·{' '}
          {thisWeek.missions} mission{thisWeek.missions === 1 ? '' : 's'}
        </Text>
      </View>

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSoft, marginTop: spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bannerLabel: { ...typography.caption, color: colors.textSoft, fontWeight: '700' },
  bannerValue: { ...typography.heading, color: colors.text, marginTop: 2 },
});
