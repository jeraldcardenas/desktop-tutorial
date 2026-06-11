/**
 * Minimal MVP profanity filter: normalizes leetspeak, masks matches.
 * Swap for a proper library (e.g. `obscenity`) before open beta.
 */
const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'faggot', 'dick'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

function normalize(text: string): string {
  return text.toLowerCase().replace(/[01345 7@$!]/g, (c) => LEET[c] ?? c);
}

export function isProfane(text: string): boolean {
  const n = normalize(text);
  return BAD_WORDS.some((w) => n.includes(w));
}

export function filterProfanity(text: string): string {
  let out = text;
  const n = normalize(text);
  for (const w of BAD_WORDS) {
    let i = n.indexOf(w);
    while (i !== -1) {
      out = out.slice(0, i) + '*'.repeat(w.length) + out.slice(i + w.length);
      i = n.indexOf(w, i + w.length);
    }
  }
  return out;
}

/** Sliding-window rate limiter keyed by arbitrary string. */
const buckets = new Map<string, number[]>();

export function rateAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
