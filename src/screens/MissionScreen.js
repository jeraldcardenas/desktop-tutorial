import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Buddy from '../components/Buddy';
import BigButton from '../components/BigButton';
import { colors, radius, spacing, typography } from '../theme';
import { speak, stop } from '../services/speech';
import { useSession } from '../context/SessionContext';
import { buildStory } from '../data/missions';

export default function MissionScreen({ navigation }) {
  const { session, completeCurrent, skipCurrent } = useSession();
  const [story, setStory] = useState(null);

  const mission = session ? session.missions[session.index] : null;
  const total = session ? session.missions.length : 0;
  const number = session ? session.index + 1 : 0;
  const isStory = mission?.mode === 'story';

  // Narrate each mission as it appears.
  useEffect(() => {
    setStory(null);
    if (mission) speak(mission.prompt);
    return () => stop();
  }, [mission?.id]);

  // Guard: if the session ran out of missions, head to the summary.
  useEffect(() => {
    if (session && session.index >= session.missions.length) {
      navigation.replace('ProgressSummary');
    }
  }, [session?.index]);

  if (!mission) return <Screen center><Text style={styles.prompt}>Loading…</Text></Screen>;

  function chooseStory(option) {
    const text = buildStory(mission.prompt, option);
    setStory(text);
    speak(text);
  }

  function onDone() {
    stop();
    completeCurrent();
    navigation.navigate('Celebration', { mission });
  }

  function onSkip() {
    stop();
    skipCurrent();
    // Advancing the index triggers the next mission (or the summary guard).
    navigation.setParams({ _t: Date.now() });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.counter}>
          Mission {number} of {total}
        </Text>
        <Pressable onPress={() => mission && speak(mission.prompt)} hitSlop={12}>
          <Text style={styles.replay}>🔊 Replay</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Buddy mood="happy" size={130} />
        <View style={styles.bubble}>
          <Text style={styles.prompt}>{mission.prompt}</Text>
        </View>

        {isStory && (
          <View style={styles.options}>
            {story ? (
              <View style={styles.storyBox}>
                <Text style={styles.story}>{story}</Text>
              </View>
            ) : (
              mission.options?.map((opt) => (
                <BigButton
                  key={opt}
                  label={opt}
                  variant="primary"
                  small
                  style={styles.option}
                  onPress={() => chooseStory(opt)}
                />
              ))
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <BigButton
          label="Done!"
          emoji="✅"
          variant="success"
          onPress={onDone}
          disabled={isStory && !story}
        />
        <BigButton label="Skip" emoji="⏭️" variant="neutral" small onPress={onSkip} />
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>Parent tip</Text>
        <Text style={styles.tip}>{mission.parentTip}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { ...typography.caption, color: colors.textSoft },
  replay: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  prompt: { ...typography.title, color: colors.text, textAlign: 'center' },
  options: { width: '100%', marginTop: spacing.lg },
  option: { marginVertical: spacing.xs },
  storyBox: {
    backgroundColor: '#FFF1D6',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  story: { ...typography.body, color: colors.text, textAlign: 'center', lineHeight: 26 },
  actions: { marginTop: spacing.md },
  tipBox: {
    backgroundColor: colors.neutral,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipLabel: { ...typography.caption, color: colors.textSoft, fontWeight: '800', marginBottom: 2 },
  tip: { ...typography.caption, color: colors.text, lineHeight: 20 },
});
