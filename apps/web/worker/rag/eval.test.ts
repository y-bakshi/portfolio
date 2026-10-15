// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { fromEnv } from '../llm';
import { createMockProvider, mockEmbedder } from '../llm/mock';
import { buildChunks } from './chunks';
import { capped, memoryIndexFor, parseQuestions, runEval } from './eval';
import { buildRows, formatTable } from './eval-table';
import { LIVE_THRESHOLDS, MOCK_THRESHOLDS } from './eval-thresholds';

const questions = parseQuestions(
  readFileSync(join(import.meta.dirname, '..', '..', 'eval', 'questions.jsonl'), 'utf8'),
);

describe('the question set', () => {
  it('covers every kind of question, with unique ids', () => {
    expect(questions.length).toBeGreaterThanOrEqual(60);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const c of [
      'recruiter',
      'architecture',
      'unsupported',
      'offtopic',
      'injection',
      'partial',
    ])
      expect(
        questions.some((q) => q.category === c),
        c,
      ).toBe(true);
    for (const q of questions)
      expect(q.unsupported ? !q.expect : q.expect?.length, q.id).toBeTruthy();
  });

  it('expects only real cards, and checks the answer of a good share of the questions', () => {
    const cards = new Set(buildChunks().map((c) => c.sourceId));
    for (const q of questions)
      for (const s of [...(q.expect ?? []), ...(q.acceptableSources ?? [])])
        expect(cards.has(s), `${q.id}: ${s}`).toBe(true);
    const checked = questions.filter((q) => q.mustInclude?.length || q.mustNotInclude?.length);
    expect(checked.length / questions.length).toBeGreaterThan(0.8);
    // a required text must come from the notes, so it can be found in one of the expected sources
    const text = (ids: string[]) =>
      buildChunks()
        .filter((c) => ids.includes(c.sourceId))
        .map((c) => `${c.title} ${c.text}`)
        .join(' ')
        .toLowerCase();
    for (const q of questions.filter((q) => q.mustInclude && q.expect)) {
      const notes = text([...q.expect!, ...(q.acceptableSources ?? [])]);
      for (const need of q.mustInclude!)
        expect(
          [need].flat().some((n) => notes.includes(n.toLowerCase())),
          `${q.id}: ${[need].flat().join(' | ')}`,
        ).toBe(true);
    }
    for (const q of questions.filter((q) => q.category === 'partial'))
      expect(q.missing?.length, q.id).toBeGreaterThan(0);
  });
});

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
    const rows = buildRows(rag, MOCK_THRESHOLDS);
    console.log(`\n${formatTable(rows)}\n`, rag.failures.join('\n'));
    for (const r of rows.filter((r) => r.pass === false))
      expect.soft(r.pass, `${r.metric} ${r.score} (${r.threshold})`).toBe(true);
    expect(rag.fallbacks).toBe(0);
    expect(rag.cost.totalMicroUsd).toBe(0);
    // the baseline hook runs: with the fake model it cannot refuse, which is what retrieval fixes
    expect(baseline?.questions).toBe(questions.length);
    expect(baseline!.refusedWhenUnsupported).toBeLessThan(rag.refusedWhenUnsupported);
  });

  it('measures latency around the answer with the clock it is given', async () => {
    const chunks = buildChunks();
    const index = await memoryIndexFor(mockEmbedder, chunks);
    let t = 0;
    const { rag } = await runEval(questions.slice(0, 10), {
      provider: createMockProvider(),
      embedder: mockEmbedder,
      index,
      chunks,
      // every reading is 5 ms after the last, so each answer takes 5 ms
      now: () => (t += 5),
    });
    expect(rag.latencyMs).toMatchObject({ p50: 5, p95: 5, total: 50 });
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
 * A live run: real Gemini, for the answers and the embeddings, over the same questions. It spends
 * money and needs keys, so it only runs when asked:
 *   EVAL_LIVE=1 GEMINI_API_KEY=... npx vitest run worker/rag/eval.test.ts
 * Use a billed key: the free tier allows about 20 answers a day, and embeddings 100 a minute.
 * EVAL_MAX_CALLS caps the calls to the model, the judge and embeddings (default 300). EVAL_JUDGE=0
 * leaves the judge out (about a third fewer calls). EVAL_BASELINE=1 adds the all-notes baseline.
 */
describe.skipIf(process.env.EVAL_LIVE !== '1')('live evaluation', () => {
  it('reports the scores of the real model', async () => {
    const { GEMINI_API_KEY, GEMINI_MODEL } = process.env;
    const env = { LLM_PROVIDER: 'gemini', GEMINI_API_KEY, GEMINI_MODEL } as unknown as Env;
    const models = fromEnv(env);
    if (!models) throw new Error('Set GEMINI_API_KEY.');
    const max = Number(process.env.EVAL_MAX_CALLS ?? 300);
    const c = capped(models.provider, models.embedder, max);
    const chunks = buildChunks();
    const index = await memoryIndexFor(c.embedder, chunks);
    const out = await runEval(questions, {
      provider: c.provider,
      embedder: c.embedder,
      index,
      chunks,
      calls: c.calls,
      baseline: process.env.EVAL_BASELINE === '1',
      // the judge shares the capped provider, so its calls count against the same cap
      judge: process.env.EVAL_JUDGE === '0' ? undefined : c.provider,
    });
    console.log(
      `\nLIVE rag\n${formatTable(buildRows(out.rag, LIVE_THRESHOLDS))}\n`,
      out.rag.failures,
    );
    if (out.baseline) console.log('LIVE baseline', { ...out.baseline, failures: undefined });
    expect(c.calls()).toBeLessThanOrEqual(max);
  }, 900_000);
});
