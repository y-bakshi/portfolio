import type { AnswerResult } from '../lib/answerer';
import { CONTACT_POINTER, NOT_IN_NOTES_RE } from './gap';
import { claimSentences, coverage, isNumber, terms } from './eval-text';
import type { Chunk } from './types';
import type { EvalQuestion, Needed, Share } from './eval-types';

/** One answered question with what the checks need: the notes it was given and what was retrieved. */
export type Sample = {
  q: EvalQuestion;
  result: AnswerResult;
  /** The notes sent to the model, or the nearest notes behind a refusal. */
  notes: Chunk[];
  /** Source ids of the best k retrieved notes, best first. */
  sources: string[];
};

/**
 * A claim sentence passes when this share of its content words is in the notes or the question.
 * Below 1 on purpose: a model may reword a note ("led" for "lead"), but a sentence that is mostly
 * words from nowhere is an invention. A number must match exactly, whatever the share.
 */
export const FAITHFUL_SHARE = 0.65;
/** A cited card is supported when the answer shares this many distinctive words with its note. */
export const SHARED_TERMS = 2;
/** A word is distinctive when no more than this share of all notes contain it. */
const DISTINCTIVE = 0.25;
/** An answer addresses the question when this share of the question's key words appear in it. */
export const RELEVANT_SHARE = 0.3;

export const share = (pass: number, of: number): Share => ({ pass, of });
export const ratio = (s: Share) => (s.of ? s.pass / s.of : 1);
export const add = (a: Share, b: Share): Share => share(a.pass + b.pass, a.of + b.of);
export const refused = (r: AnswerResult) => NOT_IN_NOTES_RE.test(r.text);
export const hasPointer = (r: AnswerResult) =>
  r.cites.includes('contact') && r.text.includes(CONTACT_POINTER);

/** Context recall for one question: the expected sources that were retrieved, as a share. */
export function recall(q: EvalQuestion, sources: string[]): Share | null {
  const want = [...new Set(q.expect ?? [])];
  if (q.unsupported || !want.length) return null;
  const got = new Set(sources);
  return share(want.filter((s) => got.has(s)).length, want.length);
}

/** Context precision for one question: of the notes sent to the model, those from a wanted source. */
export function precision(q: EvalQuestion, sources: string[], sent = 4): Share | null {
  if (q.unsupported || !q.expect?.length) return null;
  const wanted = new Set([...q.expect, ...(q.acceptableSources ?? [])]);
  const top = sources.slice(0, sent);
  return share(top.filter((s) => wanted.has(s)).length, top.length);
}

const has = (text: string, need: Needed) =>
  [need].flat().some((n) => text.toLowerCase().includes(n.toLowerCase()));

/** Answer correctness: every required text present and no forbidden one. Null with nothing to check. */
export function correct(q: EvalQuestion, text: string): boolean | null {
  if (!q.mustInclude?.length && !q.mustNotInclude?.length) return null;
  return (
    (q.mustInclude ?? []).every((n) => has(text, n)) &&
    !(q.mustNotInclude ?? []).some((n) => has(text, n))
  );
}

/** Faithfulness: claim sentences backed by the notes or the question, out of all claim sentences. */
export function faithful(s: Sample): Share {
  const known = new Set(
    terms(`${s.notes.map((c) => `${c.title} ${c.text}`).join(' ')} ${s.q.question}`),
  );
  const claims = claimSentences(s.result.text);
  const ok = claims.filter((c) => {
    const t = terms(c);
    return t.filter(isNumber).every((n) => known.has(n)) && coverage(t, known) >= FAITHFUL_SHARE;
  });
  return share(ok.length, claims.length);
}

/** Answer relevancy: an answer shares the question's key words, or an unsupported question is refused. */
export function relevant(s: Sample): boolean {
  if (refused(s.result) && !claimSentences(s.result.text).length) return Boolean(s.q.unsupported);
  const answer = new Set(terms(claimSentences(s.result.text).join(' ')));
  return coverage(terms(s.q.question), answer) >= RELEVANT_SHARE;
}

/** How many of the notes each word is in, so rare words can stand for what an answer is about. */
export function documentFrequency(chunks: Chunk[]): (term: string) => number {
  const df = new Map<string, number>();
  for (const c of chunks)
    for (const t of new Set(terms(`${c.title} ${c.text}`))) df.set(t, (df.get(t) ?? 0) + 1);
  return (t) => (df.get(t) ?? 0) / Math.max(1, chunks.length);
}

/**
 * Citation accuracy: for each card cited beside a claim, the answer's distinctive words (rare across
 * all notes) must also be in that card's note. The contact card on a pointer is not a claim.
 */
export function cited(s: Sample, freq: (t: string) => number): Share {
  const claims = claimSentences(s.result.text);
  const checked = s.result.cites.filter((c) => !(c === 'contact' && hasPointer(s.result)));
  if (!claims.length) return share(0, 0);
  const rare = [...new Set(terms(claims.join(' ')))].filter((t) => freq(t) <= DISTINCTIVE);
  const need = Math.min(SHARED_TERMS, rare.length);
  const ok = checked.filter((c) => {
    const have = new Set(
      s.notes.filter((n) => n.sourceId === c).flatMap((n) => terms(`${n.title} ${n.text}`)),
    );
    return have.size > 0 && rare.filter((t) => have.has(t)).length >= Math.max(1, need);
  });
  return share(ok.length, checked.length);
}

/** Gap handling: the pointer to Yash is there when it should be, and absent when it should not. */
export function gapCorrect(q: EvalQuestion, r: AnswerResult): boolean | null {
  if (q.category === 'unsupported') return refused(r) && hasPointer(r);
  if (q.category === 'offtopic' || q.category === 'injection') return !r.cites.includes('contact');
  return null;
}

/** A partial question is answered in part, names what is missing, and points to Yash. */
export function partialNamed(q: EvalQuestion, r: AnswerResult): boolean | null {
  if (q.category !== 'partial') return null;
  const named = (q.missing ?? []).some((w) => r.text.toLowerCase().includes(w.toLowerCase()));
  const answeredPart = r.cites.some((c) => c !== 'contact');
  return refused(r) && hasPointer(r) && answeredPart && (named || !q.missing?.length);
}
