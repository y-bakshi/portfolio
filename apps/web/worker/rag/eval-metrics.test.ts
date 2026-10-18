// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { AnswerResult } from '../lib/answerer';
import { buildChunks } from './chunks';
import {
  cited,
  correct,
  documentFrequency,
  faithful,
  gapCorrect,
  partialNamed,
  precision,
  recall,
  relevant,
  type Sample,
} from './eval-metrics';
import { claimSentences } from './eval-text';
import type { EvalQuestion } from './eval-types';
import { CONTACT_POINTER, NOT_IN_NOTES, OFF_TOPIC } from './gap';

const chunks = buildChunks();
const note = (id: string) => chunks.find((c) => c.id === id)!;
const freq = documentFrequency(chunks);

const q = (extra: Partial<EvalQuestion>): EvalQuestion => ({
  id: 'x',
  category: 'recruiter',
  question: 'What did Yash do at Thryv?',
  ...extra,
});
const sample = (text: string, cites: string[], notes: string[], question = q({})): Sample => ({
  q: question,
  result: { text, cites },
  notes: notes.map(note),
  sources: [],
});

describe('context recall and precision', () => {
  const want = q({ expect: ['asu', 'manipal'], acceptableSources: ['general'] });

  it('recall is the share of expected sources retrieved, not just one of them', () => {
    expect(recall(want, ['asu', 'testpilot'])).toEqual({ pass: 1, of: 2 });
    expect(recall(want, ['manipal', 'asu'])).toEqual({ pass: 2, of: 2 });
    expect(recall(q({ unsupported: true }), ['asu'])).toBeNull();
  });

  it('precision is the share of the best four notes from a wanted or acceptable source', () => {
    expect(precision(want, ['asu', 'general', 'testpilot', 'testpilot', 'asu'])).toEqual({
      pass: 2,
      of: 4,
    });
    expect(precision(want, ['asu'])).toEqual({ pass: 1, of: 1 });
  });
});

describe('answer correctness', () => {
  const need = q({ mustInclude: ['Thryv', ['eight', '8']], mustNotInclude: ['$'] });

  it('needs every required text (or one of its alternatives) and none of the forbidden ones', () => {
    expect(correct(need, 'He was an intern at THRYV and led 8 people.')).toBe(true);
    expect(correct(need, 'He was an intern at Thryv.')).toBe(false);
    expect(correct(need, 'Thryv, eight people, $90 an hour.')).toBe(false);
    expect(correct(q({}), 'anything')).toBeNull();
  });
});

describe('faithfulness', () => {
  const notes = ['role:thryv'];

  it('passes a sentence made of words from the notes and the question', () => {
    const s = sample('Yash was a software engineering intern at Thryv.', [], notes);
    expect(faithful(s)).toEqual({ pass: 1, of: 1 });
  });

  it('fails a sentence of words from nowhere, and an invented number', () => {
    expect(faithful(sample('He ran the Kubernetes platform for a bank.', [], notes))).toEqual({
      pass: 0,
      of: 1,
    });
    // every other word is in the notes, but 90 is not
    expect(faithful(sample('Yash gated 90 API operations at Thryv.', [], notes)).pass).toBe(0);
    expect(faithful(sample('Yash gated 100 API operations at Thryv.', [], notes)).pass).toBe(1);
  });

  it('does not count the sentences the site writes as claims', () => {
    const text = `Yash was an intern at Thryv. His pay is not in my notes. ${CONTACT_POINTER}`;
    expect(claimSentences(text)).toEqual(['Yash was an intern at Thryv.']);
    expect(claimSentences(NOT_IN_NOTES)).toEqual([]);
    // the off-topic reply is the site's wording, not a claim about Yash
    expect(claimSentences(OFF_TOPIC)).toEqual([]);
    expect(faithful(sample(NOT_IN_NOTES, [], notes))).toEqual({ pass: 0, of: 0 });
  });
});

describe('citation accuracy', () => {
  const text = 'Yash led CatScript, a C++17 language with a lexer and an interpreter.';

  it('passes when the cited note shares the answer’s distinctive terms', () => {
    const s = sample(text, ['catscript'], ['project:catscript#detail']);
    expect(cited(s, freq)).toEqual({ pass: 1, of: 1 });
  });

  it('fails when the cited note is about something else', () => {
    const s = sample(text, ['thryv'], ['project:catscript#detail', 'role:thryv']);
    expect(cited(s, freq)).toEqual({ pass: 0, of: 1 });
  });

  it('does not check the contact card on a pointer, or the cards behind a refusal', () => {
    const partial = `${text} His pay is not in my notes. ${CONTACT_POINTER}`;
    const s = sample(partial, ['catscript', 'contact'], ['project:catscript#detail']);
    expect(cited(s, freq)).toEqual({ pass: 1, of: 1 });
    const refusal = sample(
      `That is not in my notes yet. ${CONTACT_POINTER}`,
      ['thryv', 'contact'],
      [],
    );
    expect(cited(refusal, freq)).toEqual({ pass: 0, of: 0 });
  });
});

describe('answer relevancy', () => {
  it('needs the question’s key words in the answer, or a refusal of an unsupported question', () => {
    const ask = q({ question: 'Which databases has he used?' });
    expect(relevant(sample('He used PostgreSQL and Neo4j databases.', [], [], ask))).toBe(true);
    expect(relevant(sample('He enjoys long walks.', [], [], ask))).toBe(false);
    const gone = q({ question: 'What is his salary?', unsupported: true });
    expect(relevant(sample('That is not in my notes.', [], [], gone))).toBe(true);
    expect(relevant(sample('That is not in my notes.', [], [], ask))).toBe(false);
  });
});

describe('gap handling', () => {
  const r = (text: string, cites: string[]): AnswerResult => ({ text, cites });
  const pointed = r(`That is not in my notes yet. ${CONTACT_POINTER}`, ['contact']);
  const plain = r(NOT_IN_NOTES, []);

  it('expects the pointer for an unsupported question about Yash, and no pointer for the rest', () => {
    expect(gapCorrect(q({ category: 'unsupported' }), pointed)).toBe(true);
    expect(gapCorrect(q({ category: 'unsupported' }), plain)).toBe(false);
    expect(gapCorrect(q({ category: 'offtopic' }), plain)).toBe(true);
    expect(gapCorrect(q({ category: 'injection' }), pointed)).toBe(false);
    expect(gapCorrect(q({ category: 'recruiter' }), pointed)).toBeNull();
  });

  it('wants a partial answer to name what is missing, keep its card and point to Yash', () => {
    const ask = q({ category: 'partial', missing: ['pay', 'salary'] });
    const good = r(`He did the work. His pay is not in my notes. ${CONTACT_POINTER}`, [
      'thryv',
      'contact',
    ]);
    expect(partialNamed(ask, good)).toBe(true);
    expect(partialNamed(ask, r('He did the work.', ['thryv']))).toBe(false);
    expect(partialNamed(ask, r(`It is not in my notes. ${CONTACT_POINTER}`, ['contact']))).toBe(
      false,
    );
    expect(partialNamed(q({}), good)).toBeNull();
  });
});
