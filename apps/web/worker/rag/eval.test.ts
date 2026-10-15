// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { createMockProvider, mockEmbedder } from '../llm/mock';
import { fromEnv } from '../llm';
import { createWorkersAiEmbedder, restAi } from '../llm/workersai';
import { buildChunks } from './chunks';
import { capped, memoryIndexFor, parseQuestions, runEval, type EvalReport } from './eval';

const questions = parseQuestions(
  readFileSync(join(import.meta.dirname, '..', '..', 'eval', 'questions.jsonl'), 'utf8'),
);

describe('the question set', () => {
  it('covers every kind of question, with unique ids', () => {
    expect(questions.length).toBeGreaterThanOrEqual(40);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const c of ['recruiter', 'architecture', 'unsupported', 'offtopic', 'injection'])
      expect(
        questions.some((q) => q.category === c),
        c,
      ).toBe(true);
    for (const q of questions)
      expect(q.unsupported ? !q.expect : q.expect?.length, q.id).toBeTruthy();
  });
});

/**
 * Minimum scores with the fake embedder and fake model, which only know hashed words. They are
 * deliberately modest: they catch a broken retrieval, prompt or citation check, not model quality.
 * Real quality is measured with the live run (EVAL_LIVE=1).
 */
export const MOCK_THRESHOLDS = {
  hitRateAtK: 0.85,
  citationValidity: 1,
  // a hashed-word embedder cannot tell a paraphrase from an unrelated question that shares a word,
  // so these are lower than a real model should reach
  refusalCorrectness: 0.78,
  refusedWhenUnsupported: 0.6,
  answeredWhenSupported: 0.85,
};

describe('evaluation with the mock provider', () => {
  it('meets the minimum scores and never cites a card it was not given', async () => {
    const chunks = buildChunks();
    const index = await memoryIndexFor(mockEmbedder, chunks);
    const { rag, baseline } = await runEval(questions, {
      provider: createMockProvider(),
      embedder: mockEmbedder,
      index,
      chunks,
      baseline: true,
    });
    console.log('rag', JSON.stringify({ ...rag, failures: undefined }), rag.failures);
    console.log('baseline', JSON.stringify({ ...baseline, failures: undefined }));
    expect(rag.hitRateAtK).toBeGreaterThanOrEqual(MOCK_THRESHOLDS.hitRateAtK);
    expect(rag.citationValidity).toBe(MOCK_THRESHOLDS.citationValidity);
    expect(rag.refusalCorrectness).toBeGreaterThanOrEqual(MOCK_THRESHOLDS.refusalCorrectness);
    expect(rag.refusedWhenUnsupported).toBeGreaterThanOrEqual(
      MOCK_THRESHOLDS.refusedWhenUnsupported,
    );
    // the baseline hook runs: with the fake model it cannot refuse, which is what retrieval fixes
    expect(rag.answeredWhenSupported).toBeGreaterThanOrEqual(MOCK_THRESHOLDS.answeredWhenSupported);
    expect(baseline?.questions).toBe(questions.length);
    expect(baseline!.refusedWhenUnsupported).toBeLessThan(rag.refusedWhenUnsupported);
  });

  it('stops at the call cap instead of spending more', async () => {
    const chunks = buildChunks();
    const index = await memoryIndexFor(mockEmbedder, chunks);
    const c = capped(createMockProvider(), mockEmbedder, 3);
    await expect(
      runEval(questions, { provider: c.provider, embedder: c.embedder, index, chunks }),
    ).rejects.toThrow(/call cap/);
    expect(c.calls()).toBe(4);
  });
});

/**
 * A live run: real Gemini (and Workers AI as the fallback) over the same questions. It spends
 * money and needs keys, so it only runs when asked:
 *   EVAL_LIVE=1 GEMINI_API_KEY=... CF_ACCOUNT_ID=... CF_API_TOKEN=... npx vitest run worker/rag/eval.test.ts
 * EVAL_MAX_CALLS caps the calls to the model and to embeddings (default 150). Add EVAL_BASELINE=1
 * for the all-notes baseline, which roughly doubles the model calls.
 */
describe.skipIf(process.env.EVAL_LIVE !== '1')('live evaluation', () => {
  it('reports the scores of the real model', async () => {
    const { GEMINI_API_KEY, GEMINI_MODEL, CF_ACCOUNT_ID: acct, CF_API_TOKEN: token } = process.env;
    if (!acct || !token) throw new Error('Set CF_ACCOUNT_ID and CF_API_TOKEN for embeddings.');
    const ai = restAi(acct, token);
    const env = { LLM_PROVIDER: 'gemini', GEMINI_API_KEY, GEMINI_MODEL, AI: ai } as unknown as Env;
    const models = fromEnv(env);
    if (!models) throw new Error('Set GEMINI_API_KEY.');
    const max = Number(process.env.EVAL_MAX_CALLS ?? 150);
    const c = capped(models.provider, createWorkersAiEmbedder(ai), max);
    const chunks = buildChunks();
    const index = await memoryIndexFor(c.embedder, chunks);
    const out = await runEval(questions, {
      provider: c.provider,
      embedder: c.embedder,
      index,
      chunks,
      calls: c.calls,
      baseline: process.env.EVAL_BASELINE === '1',
    });
    const show = (r: EvalReport) => ({ ...r, failures: r.failures.length });
    console.log('LIVE rag', show(out.rag), out.rag.failures);
    if (out.baseline) console.log('LIVE baseline', show(out.baseline));
    expect(c.calls()).toBeLessThanOrEqual(max);
  }, 600_000);
});
