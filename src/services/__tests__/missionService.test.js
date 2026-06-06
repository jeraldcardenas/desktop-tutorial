import {
  shuffle,
  filterMissions,
  buildSession,
  getSessionMissions,
} from '../missionService';
import missions from '../../data/missions';

// Deterministic RNG for reproducible tests.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('shuffle', () => {
  it('returns a new array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seeded(1));
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffle(input, seeded(7));
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('filterMissions', () => {
  it('returns only missions for the given age group', () => {
    const out = filterMissions('1-2');
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((m) => m.ageGroup === '1-2')).toBe(true);
  });

  it('filters by theme when provided', () => {
    const out = filterMissions('3-4', 'space');
    expect(out.every((m) => m.ageGroup === '3-4' && m.theme === 'space')).toBe(true);
  });
});

describe('buildSession', () => {
  it('returns the requested number of missions', () => {
    const out = buildSession({ ageGroup: '2-3', theme: 'ocean', count: 5, rng: seeded(3) });
    expect(out).toHaveLength(5);
  });

  it('returns unique missions (no duplicates)', () => {
    const out = buildSession({ ageGroup: '3-4', theme: 'jungle', count: 9, rng: seeded(9) });
    const ids = new Set(out.map((m) => m.id));
    expect(ids.size).toBe(out.length);
  });

  it('only includes missions for the chosen age group', () => {
    const out = buildSession({ ageGroup: '1-2', theme: 'colors', count: 9, rng: seeded(2) });
    expect(out.every((m) => m.ageGroup === '1-2')).toBe(true);
  });

  it('prefers the chosen theme first', () => {
    const out = buildSession({ ageGroup: '2-3', theme: 'animals', count: 3, rng: seeded(5) });
    // With plenty of on-theme missions available, the top picks should be on-theme.
    expect(out.some((m) => m.theme === 'animals')).toBe(true);
  });

  it('varies game modes when possible', () => {
    const out = buildSession({ ageGroup: '3-4', theme: 'colors', count: 5, rng: seeded(11) });
    const modes = new Set(out.map((m) => m.mode));
    expect(modes.size).toBeGreaterThan(1);
  });
});

describe('getSessionMissions', () => {
  it('resolves to a built session (async provider seam)', async () => {
    const out = await getSessionMissions({ ageGroup: '1-2', theme: 'jungle', count: 3 });
    expect(out).toHaveLength(3);
  });
});

describe('mission database integrity', () => {
  it('has at least 100 missions', () => {
    expect(missions.length).toBeGreaterThanOrEqual(100);
  });

  it('has unique ids', () => {
    const ids = new Set(missions.map((m) => m.id));
    expect(ids.size).toBe(missions.length);
  });

  it('every mission has the required fields', () => {
    for (const m of missions) {
      expect(typeof m.id).toBe('string');
      expect(['1-2', '2-3', '3-4']).toContain(m.ageGroup);
      expect(['jungle', 'ocean', 'space', 'animals', 'colors']).toContain(m.theme);
      expect(['language', 'motor', 'social', 'cognitive', 'emotion', 'pretend']).toContain(m.category);
      expect(m.prompt).toBeTruthy();
      expect(m.parentTip).toBeTruthy();
      expect(m.celebration).toBeTruthy();
    }
  });

  it('story missions include options', () => {
    for (const m of missions.filter((x) => x.mode === 'story')) {
      expect(Array.isArray(m.options)).toBe(true);
      expect(m.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers all three age groups', () => {
    const ages = new Set(missions.map((m) => m.ageGroup));
    expect(ages).toEqual(new Set(['1-2', '2-3', '3-4']));
  });
});
