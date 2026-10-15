import type { Chunk } from './types';

/**
 * What the guide does when the notes cannot fully answer. The model only decides whether the notes
 * cover the question; the pointer to Yash and the related cards are added here, in code, so they do
 * not depend on the model remembering to write them.
 *
 * Every wording below keeps the phrase "not in my notes". The stats query, the answer check and the
 * eval all look for it, so do not reword it.
 */

/** True for any answer that says something is missing, whole or in part. */
export const NOT_IN_NOTES_RE = /not in my notes/i;

/** A question the notes do not touch at all: no pointer, no cards. */
export const NOT_IN_NOTES =
  'That is not in my notes yet. Try one of the suggested questions, or browse the projects below.';

/** The same refusal for a question close to the notes; the pointer follows it. */
export const NEAR_MISS = 'That is not in my notes yet.';

export const CONTACT_POINTER =
  'Yash can answer this himself, and the contact section has his email and a booking link.';

export const RELATED_NOTE = 'The nearest things on this site are shown below.';

/**
 * Below this share of the answer threshold a question is treated as unrelated to Yash (the weather,
 * a poem), so it gets no pointer. At or above it, but under the threshold, related notes exist but
 * do not answer: the guide refuses, points to Yash and shows the nearest cards. A score is a blunt
 * judge of "about Yash", so this is a starting value to tune with the live eval.
 */
export const CONTACT_RATIO = 0.6;

export const contactFloor = (minScore: number, override?: number) =>
  override !== undefined && Number.isFinite(override) ? override : minScore * CONTACT_RATIO;

// a visitor trying to change the rules is not asking Yash anything, whatever the score
const INJECTION =
  /\b(ignore|forget|disregard)\b[^.?!]{0,40}\b(instructions|rules|notes|prompt)\b|system prompt|you are now|new instruction/i;
export const looksLikeInjection = (question: string) => INJECTION.test(question);

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

/** An answer is partial when something besides the "not in my notes" sentence is left. */
export const isPartial = (text: string) => sentences(text).some((s) => !NOT_IN_NOTES_RE.test(s));

/** Up to two page cards behind the best notes, for the visitor to read instead. */
export function relatedCards(chunks: Chunk[], registry: ReadonlySet<string>, max = 2): string[] {
  const ids = chunks.map((c) => c.sourceId).filter((s) => s !== 'contact' && registry.has(s));
  return [...new Set(ids)].slice(0, max);
}

/**
 * Adds the way forward to an answer that says something is not in the notes. A full refusal gets
 * the related cards; a partial one keeps the cards of the part it did answer. Both get `contact`.
 */
export function withPointer(
  text: string,
  question: string,
  claimCites: string[],
  given: Chunk[],
  registry: ReadonlySet<string>,
): { text: string; cites: string[]; retrieved: string[] } {
  if (looksLikeInjection(question)) return { text, cites: [], retrieved: [] };
  const partial = isPartial(text);
  const related = partial ? [] : relatedCards(given, registry);
  const cites = [...new Set([...(partial ? claimCites : related), 'contact'])];
  const note = related.length ? ` ${RELATED_NOTE}` : '';
  const has = text.includes(CONTACT_POINTER);
  return {
    text: has ? text : `${text} ${CONTACT_POINTER}${note}`,
    cites,
    retrieved: given.filter((c) => cites.includes(c.sourceId)).map((c) => c.id),
  };
}
