import { CONTACT_POINTER, NOT_IN_NOTES, NOT_IN_NOTES_RE, OFF_TOPIC, OFF_TOPIC_RE } from './gap';

// words that carry no claim, so a sentence is judged on its content words only
const STOP = new Set(
  `a about after all also an and any are as at be been being but by can could did do does for from had has have he her him his how i if in into is it its just like may me more most my no not of on one only or other our out over she should so some such than that the their them then there these they this those to too up us very was we were what when where which while who whom why will with would you your yash notes note site page tell show give yes`.split(
    ' ',
  ),
);

/** A rough stem, applied to both sides of every comparison so only equal stems have to match. */
function stem(word: string): string {
  if (word.length <= 4 || /\d/.test(word)) return word;
  return word.replace(/(ies|ing|ed|es|s)$/, (m) => (m === 'ies' ? 'y' : ''));
}

/** Lower-case content words and numbers, without common words. "6,052" becomes one number, 6052. */
export function terms(text: string): string[] {
  const plain = text.toLowerCase().replace(/(\d),(?=\d)/g, '$1');
  return (plain.match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w)).map(stem);
}

export const isNumber = (term: string) => /^\d+$/.test(term);

export const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

// every sentence the site writes itself: the pointer, the nearest-cards line and the plain refusal
const SITE_SENTENCES = new Set(
  [NOT_IN_NOTES, OFF_TOPIC, CONTACT_POINTER].flatMap((t) => sentences(t)),
);

/**
 * The sentences that make claims. The refusal sentence, the pointer to Yash and the line about the
 * nearest cards are written by the site, not by the model, and say nothing about Yash, so they are
 * not checked as claims.
 */
export function claimSentences(text: string): string[] {
  return sentences(text).filter(
    (s) => !NOT_IN_NOTES_RE.test(s) && !OFF_TOPIC_RE.test(s) && !SITE_SENTENCES.has(s),
  );
}

/** The share of `wanted` terms that also appear in `have`. 1 when nothing is wanted. */
export function coverage(wanted: string[], have: Set<string>): number {
  const unique = [...new Set(wanted)];
  return unique.length ? unique.filter((t) => have.has(t)).length / unique.length : 1;
}
