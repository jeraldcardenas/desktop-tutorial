import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Buddy from '../components/Buddy';
import BigButton from '../components/BigButton';
import Confetti from '../components/Confetti';
import { CATEGORIES } from '../constants';
import { colors, radius, spacing, typography } from '../theme';
import { speak } from '../services/speech';
import { useSession } from '../context/SessionContext';

export default function CelebrationScreen({ navigation, route }) {
  const { session } = useSession();
  const mission = route.params?.mission;
  const cat = mission ? CATEGORIES[mission.category] : null;

  // Is this the final mission of the session?
  const isLast = session ? session.index >= session.missions.length : true;

  useEffect(() => {
    speak(mission?.celebration || 'Great job!');
  }, []);

  return (
    <Screen center>
      <Confetti />
      <Buddy mood="cheer" size={150} />

      <Text style={styles.title}>{mission?.celebration || 'Great job!'}</Text>

      {cat && (
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>{cat.emoji}</Text>
          <Text style={styles.badgeText}>{cat.label} skill earned!</Text>
        </View>
      )}

      <View style={styles.actions}>
        {isLast ? (
          <BigButton
            label="See My Adventure!"
            emoji="🏆"
            variant="primary"
            onPress={() => navigation.replace('ProgressSummary')}
          />
        ) : (
          <BigButton
            label="Next Mission"
            emoji="➡️"
            variant="success"
            onPress={() => navigation.navigate('Mission')}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeEmoji: { fontSize: 26, marginRight: spacing.sm },
  badgeText: { ...typography.body, color: colors.text, fontWeight: '700' },
  actions: { marginTop: spacing.xxl, width: '100%' },
});
