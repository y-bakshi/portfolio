import type { Clock } from './clock';
import type { Db } from './db';

const DAY = 86_400_000;

/** An answer whose best retrieval score is below this counts as a weak match (a content gap). */
export const LOW_SCORE = 0.5;

export type Daily = { day: string; questions: number; answers: number; costMicroUsd: number };
export type Question = { text: string; count: number };
export type WeakQuestion = { text: string; score: number | null; refused: boolean; at: string };

export type Summary = {
  range: { days: number; from: string; to: string };
  totals: { chats: number; questions: number; answers: number };
  daily: Daily[];
  costMicroUsd: number;
  latencyMs: { p50: number | null; p95: number | null };
  thumbs: { up: number; down: number; upRatio: number | null };
  fallbackRate: number | null;
  rateLimited: number;
  topQuestions: Question[];
  lowConfidence: WeakQuestion[];
};

/** Nearest-rank percentile of already sorted numbers, or null when there are none. */
export function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY_SQL = "strftime('%Y-%m-%d', created_at / 1000, 'unixepoch')";

/** How many days back to look: a whole number from 1 to 90, 30 when missing or not a number. */
export function clampDays(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 90) : 30;
}

/**
 * Read-only summary of how the guide was used. Counts come from `events` and `messages`; the
 * percentiles are computed here in JS (nearest rank) from the latencies of answer_shown events,
 * because SQLite has no percentile function. The newest 20,000 latencies are enough.
 */
export async function getSummary(
  db: Db,
  clock: Clock,
  options: { days?: number; lowScore?: number } = {},
): Promise<Summary> {
  const days = clampDays(options.days ?? 30);
  const lowScore = options.lowScore ?? LOW_SCORE;
  const to = clock();
  const from = to - days * DAY;
  const range = [from, to];

  const counts = await db
    .prepare(
      `SELECT type, COUNT(*) AS n,
        COALESCE(SUM(CASE WHEN type = 'answer_shown'
          THEN json_extract(data_json, '$.costMicroUsd') END), 0) AS cost
       FROM events WHERE created_at BETWEEN ? AND ? GROUP BY type`,
    )
    .bind(...range)
    .all<{ type: string; n: number; cost: number }>();
  const by = new Map(counts.results.map((r) => [r.type, r]));
  const count = (type: string) => by.get(type)?.n ?? 0;

  const perDay = await db
    .prepare(
      `SELECT ${DAY_SQL} AS day, type, COUNT(*) AS n,
        COALESCE(SUM(CASE WHEN type = 'answer_shown'
          THEN json_extract(data_json, '$.costMicroUsd') END), 0) AS cost
       FROM events WHERE type IN ('question_asked', 'answer_shown') AND created_at BETWEEN ? AND ?
       GROUP BY day, type`,
    )
    .bind(...range)
    .all<{ day: string; type: string; n: number; cost: number }>();
  // every day in the range appears, even a quiet one, so the chart has no gaps
  const daily = new Map<string, Daily>();
  for (let t = from; t <= to; t += DAY) {
    daily.set(isoDay(t), { day: isoDay(t), questions: 0, answers: 0, costMicroUsd: 0 });
  }
  for (const r of perDay.results) {
    const d = daily.get(r.day);
    if (!d) continue;
    if (r.type === 'question_asked') d.questions = r.n;
    else {
      d.answers = r.n;
      d.costMicroUsd = r.cost;
    }
  }

  const latencies = await db
    .prepare(
      `SELECT json_extract(data_json, '$.latencyMs') AS ms FROM events
       WHERE type = 'answer_shown' AND created_at BETWEEN ? AND ?
         AND json_extract(data_json, '$.latencyMs') IS NOT NULL
       ORDER BY created_at DESC LIMIT 20000`,
    )
    .bind(...range)
    .all<{ ms: number }>();
  const sorted = latencies.results.map((r) => r.ms).sort((a, b) => a - b);

  const thumbs = await db
    .prepare(
      `SELECT COALESCE(SUM(value = 1), 0) AS up, COALESCE(SUM(value = -1), 0) AS down
       FROM feedback WHERE created_at BETWEEN ? AND ?`,
    )
    .bind(...range)
    .first<{ up: number; down: number }>();
  const up = thumbs?.up ?? 0;
  const down = thumbs?.down ?? 0;

  const top = await db
    .prepare(
      `SELECT lower(trim(text)) AS text, COUNT(*) AS count FROM messages
       WHERE role = 'user' AND created_at BETWEEN ? AND ?
       GROUP BY lower(trim(text)) ORDER BY count DESC, text LIMIT 20`,
    )
    .bind(...range)
    .all<Question>();

  // a user message and the assistant message right after it (same chat, next seq). A refusal is
  // found by its words, not by empty cites: it now carries the contact card as a way forward.
  const weak = await db
    .prepare(
      `SELECT u.text AS text, a.top_score AS score, u.created_at AS at,
        (lower(a.text) LIKE '%not in my notes%') AS refused
       FROM messages u JOIN messages a ON a.chat_id = u.chat_id AND a.seq = u.seq + 1
       WHERE u.role = 'user' AND a.role = 'assistant' AND u.created_at BETWEEN ? AND ?
         AND ((a.top_score IS NOT NULL AND a.top_score < ?)
           OR lower(a.text) LIKE '%not in my notes%')
       ORDER BY u.created_at DESC LIMIT 50`,
    )
    .bind(...range, lowScore)
    .all<{ text: string; score: number | null; at: number; refused: number }>();

  const questions = count('question_asked');
  return {
    range: { days, from: new Date(from).toISOString(), to: new Date(to).toISOString() },
    totals: { chats: count('chat_started'), questions, answers: count('answer_shown') },
    daily: [...daily.values()].sort((a, b) => a.day.localeCompare(b.day)),
    costMicroUsd: by.get('answer_shown')?.cost ?? 0,
    latencyMs: { p50: percentile(sorted, 50), p95: percentile(sorted, 95) },
    thumbs: { up, down, upRatio: up + down ? up / (up + down) : null },
    fallbackRate: questions ? count('fallback_used') / questions : null,
    rateLimited: count('rate_limited'),
    topQuestions: top.results,
    lowConfidence: weak.results.map((r) => ({
      text: r.text,
      score: r.score,
      refused: Boolean(r.refused),
      at: new Date(r.at).toISOString(),
    })),
  };
}
