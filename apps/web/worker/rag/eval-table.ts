import type { EvalReport } from './eval-types';

/** A limit for one metric: at least `min`, or at most `max`. No limit means the row is only shown. */
export type Limit = { min?: number; max?: number };

export type Thresholds = Partial<Record<string, Limit>>;

export type Row = { metric: string; score: string; threshold: string; pass: boolean | null };

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const ms = (n: number) => `${Math.round(n)} ms`;

/**
 * One row per metric: the score, the limit it is held to and whether it passes. A metric without a
 * limit shows "-" and no verdict. The keys of `thresholds` are the names in `lines` below.
 */
export function buildRows(r: EvalReport, limits: Thresholds): Row[] {
  const lines: [string, number, (n: number) => string][] = [
    ['contextRecall', r.contextRecall, pct],
    ['contextPrecision', r.contextPrecision, pct],
    ['faithfulness', r.faithfulness, pct],
    ['answerCorrectness', r.answerCorrectness, pct],
    ['answerRelevancy', r.answerRelevancy, pct],
    ['citationAccuracy', r.citationAccuracy, pct],
    ['latencyP95', r.latencyMs.p95, ms],
    ['costPerQuestion', r.cost.perQuestionMicroUsd, (n) => `${n.toFixed(0)} micro-USD`],
    ['hitRateAtK', r.hitRateAtK, pct],
    ['citationValidity', r.citationValidity, pct],
    ['refusalCorrectness', r.refusalCorrectness, pct],
    ['gapHandling', r.gapHandling, pct],
    ['falsePointers', r.falsePointers, pct],
    ['partialNamed', r.partialNamed, pct],
  ];
  if (r.judge) {
    lines.push(['judgeFaithfulness', r.judge.faithfulness, pct]);
    lines.push(['judgeRelevancy', r.judge.relevancy, pct]);
  }
  return lines.map(([name, value, show]) => {
    const l = limits[name];
    const pass = l
      ? (l.min === undefined || value >= l.min) && (l.max === undefined || value <= l.max)
      : null;
    const text = l ? `${l.min !== undefined ? `>= ${show(l.min)}` : `<= ${show(l.max!)}`}` : '-';
    return { metric: name, score: show(value), threshold: text, pass };
  });
}

/** The rows as a plain table for the test log. */
export function formatTable(rows: Row[]): string {
  const cols = ['Metric', 'Score', 'Threshold', 'Result'] as const;
  const cells = rows.map((r) => [
    r.metric,
    r.score,
    r.threshold,
    r.pass === null ? '' : r.pass ? 'pass' : 'FAIL',
  ]);
  const width = cols.map((c, i) => Math.max(c.length, ...cells.map((row) => row[i]!.length)));
  const line = (row: readonly string[]) => row.map((c, i) => c.padEnd(width[i]!)).join('  ');
  return [line(cols), line(width.map((w) => '-'.repeat(w))), ...cells.map(line)].join('\n');
}
