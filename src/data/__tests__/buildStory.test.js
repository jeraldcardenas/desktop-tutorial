import { buildStory } from '../missions';

describe('buildStory', () => {
  it('includes the chosen word in the story', () => {
    const story = buildStory('Once upon a time, a little dinosaur found a...', 'Apple');
    expect(story).toContain('Apple');
    expect(story).toMatch(/The End!$/);
  });

  it('strips the trailing ellipsis from the prompt', () => {
    const story = buildStory('A happy fish swam to a...', 'Shell');
    expect(story).not.toContain('...');
  });

  it('handles a missing choice gracefully', () => {
    const story = buildStory('A robot found a...', undefined);
    expect(typeof story).toBe('string');
    expect(story.length).toBeGreaterThan(0);
  });

  it('produces 2-3 short sentences', () => {
    const story = buildStory('A turtle discovered a...', 'Treasure');
    const sentences = story.split(/[.!]/).filter((s) => s.trim().length > 0);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
  });
});
