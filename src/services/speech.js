/**
 * Text-to-speech wrapper around expo-speech.
 *
 * Voice narration is core to TalkQuest (minimal reading required). This module
 * degrades gracefully: if speech is unavailable on the platform it simply
 * no-ops so the UI keeps working. A module-level flag lets Settings mute it.
 */
import * as Speech from 'expo-speech';

let _enabled = true;

export function setVoiceEnabled(enabled) {
  _enabled = !!enabled;
  if (!_enabled) stop();
}

export function isVoiceEnabled() {
  return _enabled;
}

/**
 * Speak a phrase with a warm, slightly slow, child-friendly cadence.
 * Always stops any in-flight utterance first so prompts don't overlap.
 */
export function speak(text, opts = {}) {
  if (!_enabled || !text) return;
  try {
    Speech.stop();
    Speech.speak(String(text), {
      pitch: 1.15, // a touch higher = friendlier
      rate: 0.9, // a little slow for little ears
      ...opts,
    });
  } catch (e) {
    // Speech not available on this platform/build — silently ignore.
  }
}

export function stop() {
  try {
    Speech.stop();
  } catch (e) {
    // ignore
  }
}
