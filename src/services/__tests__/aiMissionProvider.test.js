import {
  validateMission,
  coerceMissions,
  extractMissions,
  buildUserPrompt,
  generateMissions,
} from '../aiMissionProvider';

describe('validateMission', () => {
  const good = {
    category: 'language',
    mode: 'treasure',
    prompt: 'Find something blue!',
    parentTip: 'Name it together.',
    celebration: 'Great job!',
  };

  it('accepts a well-formed mission', () => {
    expect(validateMission(good)).toBe(true);
  });

  it('rejects unknown category or mode', () => {
    expect(validateMission({ ...good, category: 'medical' })).toBe(false);
    expect(validateMission({ ...good, mode: 'quiz' })).toBe(false);
  });

  it('rejects missing/empty required strings', () => {
    expect(validateMission({ ...good, prompt: '' })).toBe(false);
    expect(validateMission({ ...good, celebration: '   ' })).toBe(false);
    expect(validateMission({ ...good, parentTip: undefined })).toBe(false);
  });

  it('requires options for story mode', () => {
    expect(validateMission({ ...good, mode: 'story' })).toBe(false);
    expect(validateMission({ ...good, mode: 'story', options: ['A', 'B', 'C'] })).toBe(true);
    expect(validateMission({ ...good, mode: 'story', options: ['A'] })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(validateMission(null)).toBe(false);
    expect(validateMission('nope')).toBe(false);
  });
});

describe('coerceMissions', () => {
  it('drops invalid entries and stamps age/theme/id', () => {
    const raw = [
      { category: 'motor', mode: 'copy', prompt: 'Clap!', parentTip: 'Clap along.', celebration: 'Yay!' },
      { category: 'bogus', mode: 'copy', prompt: 'x', parentTip: 'y', celebration: 'z' }, // dropped
    ];
    const out = coerceMissions(raw, { ageGroup: '2-3', theme: 'ocean' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ ageGroup: '2-3', theme: 'ocean', category: 'motor', source: 'ai' });
    expect(typeof out[0].id).toBe('string');
  });

  it('clamps overly long text', () => {
    const longPrompt = 'x'.repeat(500);
    const out = coerceMissions(
      [{ category: 'language', mode: 'treasure', prompt: longPrompt, parentTip: 'tip', celebration: 'yay' }],
      { ageGroup: '1-2', theme: 'jungle' }
    );
    expect(out[0].prompt.length).toBeLessThanOrEqual(120);
  });

  it('falls back to a safe age/theme when given garbage', () => {
    const out = coerceMissions(
      [{ category: 'language', mode: 'treasure', prompt: 'Hi', parentTip: 'tip', celebration: 'yay' }],
      { ageGroup: 'bad', theme: 'bad' }
    );
    expect(['1-2', '2-3', '3-4']).toContain(out[0].ageGroup);
    expect(['jungle', 'ocean', 'space', 'animals', 'colors']).toContain(out[0].theme);
  });

  it('keeps story options', () => {
    const out = coerceMissions(
      [{ category: 'language', mode: 'story', prompt: 'A dino found a...', parentTip: 'Read aloud.', celebration: 'Yay!', options: ['Apple', 'Car', 'Star', 'Extra'] }],
      { ageGroup: '3-4', theme: 'jungle' }
    );
    expect(out[0].options).toEqual(['Apple', 'Car', 'Star']); // clamped to 3
  });

  it('returns [] for non-arrays', () => {
    expect(coerceMissions(null, { ageGroup: '1-2', theme: 'jungle' })).toEqual([]);
  });
});

describe('extractMissions', () => {
  it('pulls missions out of a tool_use block', () => {
    const body = {
      content: [
        { type: 'text', text: 'ok' },
        { type: 'tool_use', name: 'emit_missions', input: { missions: [{ prompt: 'x' }] } },
      ],
    };
    expect(extractMissions(body)).toEqual([{ prompt: 'x' }]);
  });

  it('returns [] when there is no matching tool block', () => {
    expect(extractMissions({ content: [{ type: 'text', text: 'hi' }] })).toEqual([]);
    expect(extractMissions({})).toEqual([]);
  });
});

describe('buildUserPrompt', () => {
  it('includes count, age group, and theme label', () => {
    const p = buildUserPrompt({ ageGroup: '2-3', theme: 'space', count: 4 });
    expect(p).toContain('4');
    expect(p).toContain('2-3');
    expect(p).toContain('Space Mission');
  });
});

describe('generateMissions', () => {
  const config = { endpoint: 'https://proxy.example.com/missions', apiKey: '', model: 'claude-opus-4-8' };

  it('posts to the configured endpoint and returns coerced missions', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'tool_use',
            name: 'emit_missions',
            input: {
              missions: [
                { category: 'motor', mode: 'copy', prompt: 'Jump!', parentTip: 'Jump along.', celebration: 'Boing!' },
              ],
            },
          },
        ],
      }),
    }));

    const out = await generateMissions({ ageGroup: '2-3', theme: 'jungle', count: 3, fetchImpl, config });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe(config.endpoint);
    expect(opts.method).toBe('POST');
    expect(out).toHaveLength(1);
    expect(out[0].prompt).toBe('Jump!');
  });

  it('sends Anthropic auth headers in direct mode (no proxy)', async () => {
    const directConfig = { endpoint: '', apiKey: 'sk-test', model: 'claude-opus-4-8' };
    const fetchImpl = jest.fn(async () => ({ ok: true, json: async () => ({ content: [] }) }));
    await generateMissions({ ageGroup: '1-2', theme: 'ocean', count: 2, fetchImpl, config: directConfig });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toContain('api.anthropic.com');
    expect(opts.headers['x-api-key']).toBe('sk-test');
    expect(opts.headers['anthropic-version']).toBeTruthy();
  });

  it('throws when not configured', async () => {
    await expect(
      generateMissions({ ageGroup: '1-2', theme: 'ocean', count: 2, fetchImpl: jest.fn(), config: { endpoint: '', apiKey: '' } })
    ).rejects.toThrow(/not configured/);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    await expect(
      generateMissions({ ageGroup: '1-2', theme: 'ocean', count: 2, fetchImpl, config })
    ).rejects.toThrow(/500/);
  });
});
