// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { testDb } from '../test/sqlite-d1';
import { evalRunSql } from '../rag/eval-record';
import type { EvalReport } from '../rag/eval-types';
import { listEvalRuns } from './eval-runs';

const report = (over: Partial<EvalReport> = {}) =>
  ({
    questions: 65,
    contextRecall: 0.9,
    contextPrecision: 0.6,
    faithfulness: 0.95,
    answerCorrectness: 0.8,
    answerRelevancy: 0.9,
    citationAccuracy: 0.95,
    hitRateAtK: 0.95,
    citationValidity: 1,
    refusalCorrectness: 0.9,
    gapHandling: 0.9,
    falsePointers: 0,
    partialNamed: 0.7,
    latencyMs: { p50: 800, p95: 2000, total: 1000 },
    cost: { totalMicroUsd: 0, perQuestionMicroUsd: 0, inputTokens: 0, outputTokens: 0 },
    failures: ["it's a claim with a quote"],
    ...over,
  }) as EvalReport;

describe('saved evaluations', () => {
  it('round trips a run, quotes included, newest first, held against the live targets', async () => {
    const db = testDb();
    const add = (id: string, at: number, kind: 'live' | 'mock') =>
      db.raw.exec(
        evalRunSql({
          id,
          createdAt: at,
          kind,
          model: "it's m",
          corpusVersion: 'v1',
          report: report(),
        }),
      );
    add('a', 1000, 'mock');
    add('b', 2000, 'live');
    const runs = await listEvalRuns(db, 'v1');
    expect(runs.map((r) => r.id)).toEqual(['b', 'a']);
    expect(runs[0]).toMatchObject({ kind: 'live', model: "it's m", current: true, questions: 65 });
    expect(runs[0]!.failures).toEqual(["it's a claim with a quote"]);
    expect(runs[0]!.rows.find((r) => r.metric === 'faithfulness')).toMatchObject({
      score: '95.0%',
      pass: true,
    });
  });

  it('marks a run made with other notes as not current', async () => {
    const db = testDb();
    db.raw.exec(
      evalRunSql({
        id: 'x',
        createdAt: 1,
        kind: 'live',
        model: 'm',
        corpusVersion: 'old',
        report: report(),
      }),
    );
    expect((await listEvalRuns(db, 'new'))[0]!.current).toBe(false);
  });

  it('skips a row whose report cannot be read', async () => {
    const db = testDb();
    db.raw.exec(
      "INSERT INTO eval_runs (id, created_at, kind, model, corpus_version, questions, report_json) VALUES ('bad', 1, 'live', 'm', 'v', 1, 'not json')",
    );
    expect(await listEvalRuns(db, 'v')).toEqual([]);
  });
});
