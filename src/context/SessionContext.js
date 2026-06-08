/**
 * Holds the configuration and live state of an in-progress play session, plus
 * the persisted progress + settings. Screens read/update via the useSession hook.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  applySession,
  defaultProgress,
  defaultSettings,
} from '../services/storage';
import { setVoiceEnabled } from '../services/speech';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [progress, setProgress] = useState(defaultProgress);
  const [settings, setSettings] = useState(defaultSettings);
  const [ready, setReady] = useState(false);

  // Active session config + running tally.
  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([loadProgress(), loadSettings()]);
      setProgress(p);
      setSettings(s);
      setVoiceEnabled(s.voiceEnabled);
      setReady(true);
    })();
  }, []);

  function startSession({ ageGroup, sessionLength, theme, missions }) {
    setSession({
      ageGroup,
      sessionLength,
      theme,
      missions,
      index: 0,
      completed: [],
      skipped: 0,
    });
  }

  function completeCurrent() {
    setSession((prev) => {
      if (!prev) return prev;
      const current = prev.missions[prev.index];
      return {
        ...prev,
        completed: current ? [...prev.completed, current] : prev.completed,
        index: prev.index + 1,
      };
    });
  }

  function skipCurrent() {
    setSession((prev) =>
      prev ? { ...prev, skipped: prev.skipped + 1, index: prev.index + 1 } : prev
    );
  }

  /** Persist the finished session into long-term progress. */
  async function finishSession() {
    if (!session) return;
    const next = applySession(progress, {
      theme: session.theme,
      completed: session.completed,
      skipped: session.skipped,
    });
    setProgress(next);
    await saveProgress(next);
    setSession(null);
  }

  async function updateSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if ('voiceEnabled' in patch) setVoiceEnabled(next.voiceEnabled);
    await saveSettings(next);
  }

  async function resetAllProgress() {
    const fresh = { ...defaultProgress };
    setProgress(fresh);
    await saveProgress(fresh);
  }

  const value = useMemo(
    () => ({
      ready,
      progress,
      settings,
      session,
      startSession,
      completeCurrent,
      skipCurrent,
      finishSession,
      updateSettings,
      resetAllProgress,
    }),
    [ready, progress, settings, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
