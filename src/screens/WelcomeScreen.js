import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Buddy from '../components/Buddy';
import BigButton from '../components/BigButton';
import Disclaimer from '../components/Disclaimer';
import { colors, spacing, typography } from '../theme';
import { speak } from '../services/speech';
import { useSession } from '../context/SessionContext';

export default function WelcomeScreen({ navigation }) {
  const { settings } = useSession();

  useEffect(() => {
    const name = settings.childName ? `, ${settings.childName}` : '';
    speak(`Hi${name}! I'm Buddy. Let's go on an adventure!`);
  }, [settings.childName]);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Buddy mood="wave" size={150} />
        <Text style={styles.title}>TalkQuest</Text>
        <Text style={styles.tagline}>Play, talk, and explore with Buddy!</Text>
      </View>

      <View style={styles.actions}>
        <BigButton
          label="Start Adventure"
          emoji="🎒"
          variant="primary"
          onPress={() => navigation.navigate('AgeSelection')}
        />
        <View style={styles.secondaryRow}>
          <BigButton
            label="Parents"
            emoji="👪"
            variant="neutral"
            small
            style={styles.half}
            onPress={() => navigation.navigate('ParentDashboard')}
          />
          <BigButton
            label="Settings"
            emoji="⚙️"
            variant="neutral"
            small
            style={styles.half}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xl },
  title: { ...typography.hero, color: colors.primaryDark, marginTop: spacing.lg },
  tagline: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: { marginTop: spacing.xxl },
  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  half: { flex: 1, marginHorizontal: spacing.xs },
});
