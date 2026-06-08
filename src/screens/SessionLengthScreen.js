import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import SelectCard from '../components/SelectCard';
import BigButton from '../components/BigButton';
import { SESSION_LENGTHS } from '../constants';
import { colors, spacing, typography } from '../theme';
import { speak } from '../services/speech';

export default function SessionLengthScreen({ navigation, route }) {
  const { ageGroup } = route.params;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    speak('How long should we play?');
  }, []);

  return (
    <Screen scroll>
      <Text style={styles.title}>How long should we play?</Text>
      <Text style={styles.subtitle}>Short bursts work best for little ones.</Text>

      <View style={styles.list}>
        {SESSION_LENGTHS.map((s) => (
          <SelectCard
            key={s.id}
            emoji={s.emoji}
            title={s.label}
            subtitle={`${s.missions} fun missions`}
            color={colors.grape}
            selected={selected === s.id}
            onPress={() => setSelected(s.id)}
          />
        ))}
      </View>

      <BigButton
        label="Next"
        emoji="➡️"
        disabled={!selected}
        onPress={() =>
          navigation.navigate('ThemeSelection', {
            ageGroup,
            sessionLength: selected,
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSoft, marginTop: spacing.xs },
  list: { marginVertical: spacing.lg },
});
