import { buildRows, type Row } from '../rag/eval-table';
import { LIVE_THRESHOLDS, MOCK_THRESHOLDS } from '../rag/eval-thresholds';
import type { EvalReport } from '../rag/eval-types';
import type { Db } from './db';

export type EvalRunView = {
  id: string;
  at: string;
  kind: 'live' | 'mock';
  model: string;
  questions: number;
  /** False when the notes or the prompt have changed since the run, so its numbers describe an older guide. */
  current: boolean;
  rows: Row[];
  failures: string[];
};

type Stored = {
  id: string;
  created_at: number;
  kind: string;
  model: string;
  corpus_version: string;
  questions: number;
  report_json: string;
};

/** The newest saved evaluations, newest first, with each score held against its target. */
export async function listEvalRuns(
  db: Db,
  corpusVersion: string,
  limit = 20,
): Promise<EvalRunView[]> {
  const { results } = await db
    .prepare('SELECT * FROM eval_runs ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<Stored>();
  return results.flatMap((r) => {
    try {
      const report = JSON.parse(r.report_json) as EvalReport;
      const kind = r.kind === 'live' ? 'live' : 'mock';
      return [
        {
          id: r.id,
          at: new Date(r.created_at).toISOString(),
          kind,
          model: r.model,
          questions: r.questions,
          current: r.corpus_version === corpusVersion,
          rows: buildRows(report, kind === 'live' ? LIVE_THRESHOLDS : MOCK_THRESHOLDS),
          failures: report.failures.slice(0, 30),
        } satisfies EvalRunView,
      ];
    } catch {
      return [];
    }
  });
}
