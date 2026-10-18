import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Env } from '../worker/env';
import { fromEnv } from '../worker/llm';
import { createMockProvider, mockEmbedder } from '../worker/llm/mock';
import { buildChunks } from '../worker/rag/chunks';
import { capped, memoryIndexFor, parseQuestions, runEval } from '../worker/rag/eval';
import { evalRunSql } from '../worker/rag/eval-record';
import { corpusVersion } from '../worker/rag/version';

// Runs the labelled questions through the guide and writes worker/rag/eval-run.generated.sql, which
// saves the scores for the owner page. It spends money on a live run, so it asks for --live.
//
//   npm run eval:record -- --mock                      fake model, free: checks the plumbing
//   GEMINI_API_KEY=... npm run eval:record -- --live   real Gemini (about 200 paid calls)
//
// Then: npx wrangler d1 execute DB --remote --file=worker/rag/eval-run.generated.sql
// (use --local for the local database). EVAL_MAX_CALLS (default 300) caps the calls; EVAL_JUDGE=0 skips the judge.
export async function main(args: string[]) {
  const live = args.includes('--live');
  if (!live && !args.includes('--mock')) throw new Error('Pass --mock (free) or --live (paid).');
  const root = join(import.meta.dirname, '..');
  const questions = parseQuestions(readFileSync(join(root, 'eval', 'questions.jsonl'), 'utf8'));
  const chunks = buildChunks();

  let provider = createMockProvider();
  let embedder = mockEmbedder;
  let calls: (() => number) | undefined;
  let judge: typeof provider | undefined;
  let model = 'mock';
  if (live) {
    const { GEMINI_API_KEY, GEMINI_MODEL } = process.env;
    const env = { LLM_PROVIDER: 'gemini', GEMINI_API_KEY, GEMINI_MODEL } as unknown as Env;
    const models = fromEnv(env);
    if (!models) throw new Error('Set GEMINI_API_KEY.');
    const c = capped(models.provider, models.embedder, Number(process.env.EVAL_MAX_CALLS ?? 300));
    provider = c.provider;
    embedder = c.embedder;
    calls = c.calls;
    judge = process.env.EVAL_JUDGE === '0' ? undefined : c.provider;
    model = GEMINI_MODEL ?? 'gemini (default model)';
  }

  const index = await memoryIndexFor(embedder, chunks);
  const { rag } = await runEval(questions, { provider, embedder, index, chunks, calls, judge });
  const now = Date.now();
  const sql = evalRunSql({
    id: `eval-${now}`,
    createdAt: now,
    kind: live ? 'live' : 'mock',
    model,
    corpusVersion: corpusVersion(),
    report: rag,
  });
  writeFileSync(join(root, 'worker', 'rag', 'eval-run.generated.sql'), sql);
  console.log(
    `${live ? 'Live' : 'Mock'} run of ${rag.questions} questions: faithfulness ${(rag.faithfulness * 100).toFixed(1)}%, ` +
      `recall ${(rag.contextRecall * 100).toFixed(1)}%, ${calls ? calls() + ' calls' : 'no paid calls'}. ` +
      'Wrote worker/rag/eval-run.generated.sql',
  );
}
