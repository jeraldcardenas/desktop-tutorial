import React from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import BigButton from '../components/BigButton';
import Disclaimer from '../components/Disclaimer';
import { colors, radius, spacing, typography } from '../theme';
import { useSession } from '../context/SessionContext';
import { speak } from '../services/speech';

export default function SettingsScreen() {
  const { settings, updateSettings, resetAllProgress } = useSession();

  function confirmReset() {
    Alert.alert(
      'Reset progress?',
      'This clears all sessions and skills practiced. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetAllProgress() },
      ]
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Child's name (optional)</Text>
        <TextInput
          style={styles.input}
          value={settings.childName}
          placeholder="e.g. Mia"
          placeholderTextColor={colors.textSoft}
          onChangeText={(t) => updateSettings({ childName: t })}
          maxLength={20}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Voice narration 🔊</Text>
          <Text style={styles.rowSub}>Buddy reads missions aloud</Text>
        </View>
        <Switch
          value={settings.voiceEnabled}
          onValueChange={(v) => {
            updateSettings({ voiceEnabled: v });
            if (v) speak('Voice is on!');
          }}
          trackColor={{ true: colors.primary, false: colors.neutralDark }}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Sound effects 🎵</Text>
          <Text style={styles.rowSub}>Celebration sounds</Text>
        </View>
        <Switch
          value={settings.soundEnabled}
          onValueChange={(v) => updateSettings({ soundEnabled: v })}
          trackColor={{ true: colors.primary, false: colors.neutralDark }}
        />
      </View>

      <BigButton
        label="Reset Progress"
        emoji="🗑️"
        variant="neutral"
        small
        style={{ marginTop: spacing.lg }}
        onPress={confirmReset}
      />

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  label: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  rowSub: { ...typography.caption, color: colors.textSoft, marginTop: 2 },
});
