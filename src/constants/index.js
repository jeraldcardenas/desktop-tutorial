/**
 * App-wide constants: age groups, session lengths, themes, skill categories,
 * and the legally-important safety disclaimer.
 */

export const AGE_GROUPS = [
  { id: '1-2', label: '1–2 years', emoji: '🐣', blurb: 'Simple one-step play' },
  { id: '2-3', label: '2–3 years', emoji: '🐤', blurb: 'Colors, sounds & naming' },
  { id: '3-4', label: '3–4 years', emoji: '🦜', blurb: 'Two-step fun & stories' },
];

export const SESSION_LENGTHS = [
  { id: 3, label: '3 minutes', emoji: '⏱️', missions: 3 },
  { id: 5, label: '5 minutes', emoji: '⏲️', missions: 5 },
  { id: 10, label: '10 minutes', emoji: '⏰', missions: 9 },
];

export const THEMES = [
  { id: 'jungle', label: 'Jungle Explorer', emoji: '🌴', color: '#7BC96F' },
  { id: 'ocean', label: 'Ocean Adventure', emoji: '🌊', color: '#7EC8E3' },
  { id: 'space', label: 'Space Mission', emoji: '🚀', color: '#B79CED' },
  { id: 'animals', label: 'Animal Parade', emoji: '🐘', color: '#FFD166' },
  { id: 'colors', label: 'Color Hunt', emoji: '🌈', color: '#FF8C7A' },
];

/**
 * Skill categories tracked for the parent dashboard. The `dashboard` flag maps
 * a raw category to one of the parent-facing summary metrics.
 */
export const CATEGORIES = {
  language: { label: 'Language', emoji: '💬', metric: 'words' },
  motor: { label: 'Movement', emoji: '🤸', metric: 'movement' },
  social: { label: 'Social', emoji: '🤝', metric: 'social' },
  cognitive: { label: 'Thinking', emoji: '🧠', metric: 'cognitive' },
  emotion: { label: 'Emotions', emoji: '😊', metric: 'social' },
  pretend: { label: 'Pretend Play', emoji: '🎭', metric: 'imitation' },
};

export const GAME_MODES = {
  treasure: 'Real World Treasure Hunt',
  copy: 'Copy Me',
  animal: 'Animal Adventure',
  emotion: 'Emotion Play',
  story: 'Story Builder',
};

export const DISCLAIMER =
  'TalkQuest is a play and learning companion. It does not diagnose, treat, ' +
  'or prevent autism or developmental delays. If you have concerns about your ' +
  "child's development, consult a pediatrician or licensed specialist.";

export const STORAGE_KEYS = {
  progress: '@talkquest/progress',
  settings: '@talkquest/settings',
};
