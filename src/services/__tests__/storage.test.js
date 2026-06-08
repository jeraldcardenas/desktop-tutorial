import { applySession, favoriteTheme, weekStart, defaultProgress } from '../storage';

describe('applySession', () => {
  const base = () => ({ ...defaultProgress, themeCounts: {}, weekly: {} });

  it('increments sessionsCompleted', () => {
    const out = applySession(base(), { theme: 'jungle', completed: [], skipped: 0 });
    expect(out.sessionsCompleted).toBe(1);
  });

  it('maps categories to the right dashboard metrics', () => {
    const completed = [
      { category: 'language' },
      { category: 'motor' },
      { category: 'social' },
      { category: 'emotion' }, // also counts as social
      { category: 'cognitive' },
      { category: 'pretend' }, // imitation
    ];
    const out = applySession(base(), { theme: 'ocean', completed, skipped: 1 });
    expect(out.words).toBe(1);
    expect(out.movement).toBe(1);
    expect(out.social).toBe(2);
    expect(out.cognitive).toBe(1);
    expect(out.imitation).toBe(1);
    expect(out.missionsDone).toBe(6);
    expect(out.missionsSkipped).toBe(1);
  });

  it('accumulates across multiple sessions', () => {
    let p = base();
    p = applySession(p, { theme: 'space', completed: [{ category: 'language' }], skipped: 0 });
    p = applySession(p, { theme: 'space', completed: [{ category: 'language' }], skipped: 0 });
    expect(p.words).toBe(2);
    expect(p.sessionsCompleted).toBe(2);
    expect(p.themeCounts.space).toBe(2);
  });

  it('does not mutate the input progress object', () => {
    const input = base();
    applySession(input, { theme: 'colors', completed: [{ category: 'motor' }], skipped: 0 });
    expect(input.movement).toBe(0);
    expect(input.sessionsCompleted).toBe(0);
  });

  it('records weekly activity under the current week start', () => {
    const out = applySession(base(), {
      theme: 'animals',
      completed: [{ category: 'language' }, { category: 'motor' }],
      skipped: 0,
    });
    const wk = weekStart();
    expect(out.weekly[wk]).toEqual({ sessions: 1, missions: 2 });
  });
});

describe('favoriteTheme', () => {
  it('returns null when nothing has been played', () => {
    expect(favoriteTheme({ themeCounts: {} })).toBeNull();
    expect(favoriteTheme({})).toBeNull();
  });

  it('returns the most played theme', () => {
    expect(favoriteTheme({ themeCounts: { jungle: 1, ocean: 5, space: 2 } })).toBe('ocean');
  });
});

describe('weekStart', () => {
  it('returns the Monday for any day of the week', () => {
    // 2026-06-06 is a Saturday → Monday is 2026-06-01.
    expect(weekStart(new Date('2026-06-06T12:00:00Z'))).toBe('2026-06-01');
    // 2026-06-01 is a Monday → returns itself.
    expect(weekStart(new Date('2026-06-01T08:00:00Z'))).toBe('2026-06-01');
  });
});
