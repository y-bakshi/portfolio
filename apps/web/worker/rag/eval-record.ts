import type { EvalReport } from './eval-types';

export type EvalRunKind = 'live' | 'mock';

/** One saved evaluation: the report and what it was made with. */
export type EvalRunRecord = {
  id: string;
  createdAt: number;
  kind: EvalRunKind;
  model: string;
  corpusVersion: string;
  report: EvalReport;
};

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** The SQL that saves a run. Apply it with `wrangler d1 execute DB --file=...` (add --remote for the live database). */
export function evalRunSql(run: EvalRunRecord): string {
  const values = [
    quote(run.id),
    String(run.createdAt),
    quote(run.kind),
    quote(run.model),
    quote(run.corpusVersion),
    String(run.report.questions),
    quote(JSON.stringify(run.report)),
  ];
  return `INSERT INTO eval_runs (id, created_at, kind, model, corpus_version, questions, report_json) VALUES (${values.join(', ')});\n`;
}
