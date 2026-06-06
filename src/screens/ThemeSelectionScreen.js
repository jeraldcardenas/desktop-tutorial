import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import SelectCard from '../components/SelectCard';
import BigButton from '../components/BigButton';
import { SESSION_LENGTHS, THEMES } from '../constants';
import { colors, spacing, typography } from '../theme';
import { speak } from '../services/speech';
import { getSessionMissions } from '../services/missionService';
import { useSession } from '../context/SessionContext';

export default function ThemeSelectionScreen({ navigation, route }) {
  const { ageGroup, sessionLength } = route.params;
  const { startSession } = useSession();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    speak('Pick an adventure!');
  }, []);

  async function begin() {
    const lengthCfg = SESSION_LENGTHS.find((s) => s.id === sessionLength);
    const missions = await getSessionMissions({
      ageGroup,
      theme: selected,
      count: lengthCfg ? lengthCfg.missions : 5,
    });
    startSession({ ageGroup, sessionLength, theme: selected, missions });
    navigation.navigate('Mission');
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Pick an adventure!</Text>

      <View style={styles.list}>
        {THEMES.map((t) => (
          <SelectCard
            key={t.id}
            emoji={t.emoji}
            title={t.label}
            color={t.color}
            selected={selected === t.id}
            onPress={() => setSelected(t.id)}
          />
        ))}
      </View>

      <BigButton label="Let's Go!" emoji="🚀" disabled={!selected} onPress={begin} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  list: { marginVertical: spacing.lg },
});
