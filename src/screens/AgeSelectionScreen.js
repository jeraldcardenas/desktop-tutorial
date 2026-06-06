import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import SelectCard from '../components/SelectCard';
import BigButton from '../components/BigButton';
import { AGE_GROUPS } from '../constants';
import { colors, spacing, typography } from '../theme';
import { speak } from '../services/speech';

export default function AgeSelectionScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    speak('How old is your child?');
  }, []);

  return (
    <Screen scroll>
      <Text style={styles.title}>How old is your child?</Text>
      <Text style={styles.subtitle}>This helps Buddy pick the right missions.</Text>

      <View style={styles.list}>
        {AGE_GROUPS.map((g) => (
          <SelectCard
            key={g.id}
            emoji={g.emoji}
            title={g.label}
            subtitle={g.blurb}
            color={colors.sky}
            selected={selected === g.id}
            onPress={() => setSelected(g.id)}
          />
        ))}
      </View>

      <BigButton
        label="Next"
        emoji="➡️"
        disabled={!selected}
        onPress={() => navigation.navigate('SessionLength', { ageGroup: selected })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSoft, marginTop: spacing.xs },
  list: { marginVertical: spacing.lg },
});
