# Database Design

Status: the D1 schema in `apps/web/worker/migrations/0001_init.sql` is implemented and tested. Later migrations add the retrieval chunks. Portfolio content stays in version-controlled files; the database holds only chats, feedback, events and the retrieval index.

Cloudflare D1 (SQLite) is the store. The Worker is the only client; there is no browser access to it. Queries go through a small `Db` interface (`worker/lib/db.ts`) that D1 satisfies and that the tests satisfy with an in-memory SQLite (`worker/test/sqlite-d1.ts`), so the real migrations and SQL are tested.

## Tables

| Table            | Fields                                                                                                                                                                          | Purpose                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `chats`          | `id`, `created_at`, `last_seen_at`, `ua_class`, `locale`                                                                                                                        | One anonymous chat per random id. No IP, email or account.                                                                               |
| `messages`       | `id`, `chat_id`, `seq`, `role`, `text`, `cites_json`, `model`, `retrieval_ids_json`, `top_score`, `input_tokens`, `output_tokens`, `cost_micro_usd`, `latency_ms`, `created_at` | The questions and answers, in order. `(chat_id, seq)` is unique; deleting a chat deletes its messages.                                   |
| `feedback`       | `message_id`, `value` (-1 or 1), `created_at`                                                                                                                                   | One thumbs rating per answer.                                                                                                            |
| `events`         | `id`, `chat_id`, `type`, `data_json`, `created_at`                                                                                                                              | Usage analytics: `chat_started`, `question_asked`, `answer_shown`, `cite_clicked`, `feedback`, `rate_limited`, `fallback_used`, `error`. |
| `chunks` (later) | `id`, `source_id`, `title`, `text`, `content_hash`, `updated_at`                                                                                                                | The text of each retrieval chunk; the vectors live in Vectorize.                                                                         |

Events carry only the random chat id and a small JSON `data_json` whose keys are checked per type (numbers, thumbs of 1 or -1, and short codes such as a model name or card id; never free text; 1 KB at most). `worker/lib/events.ts` writes them and never throws; `worker/lib/stats.ts` reads them, with `messages` and `feedback`, for the owner page. Question text lives only in `messages`.

Money is stored as integer millionths of a dollar. Timestamps are integer milliseconds (UTC).

## Privacy and retention

- A visitor is never identified. A test checks that no column looks like an IP, email, phone, account or name.
- Questions are redacted before they are stored: emails, phone-like numbers and long digit runs are masked, and the length is capped.
- The chat panel tells visitors that questions and answers are saved anonymously for 90 days. A visitor can delete their chat at any time (`DELETE /api/chat`).
- A daily scheduled job deletes chats, messages, feedback and events older than 90 days.
- Rate-limit identifiers are HMACs of the network address plus a daily rotating salt. They live only in the rate-limit Durable Object for the length of the enforcement window and never in D1.

## Rate limits and budget

A SQLite-backed Durable Object class, `Guard` (binding `GUARD`), keeps the counters, because D1 is not suited to atomic counters under concurrent requests. There are only four named objects: `budget` (all spending) and `limits:chat`, `limits:session`, `limits:feedback`. The logic lives in plain modules (`worker/lib/limits.ts`, `budget.ts`) over a small key-value interface, so it is tested without Cloudflare.

- **Keys.** A limit key is a hex HMAC-SHA256 of the client IP (or of the chat id) with a salt derived from the UTC date and the `HMAC_SECRET` secret. It changes every day and cannot be reversed. It exists only inside the Guard object for the length of its window.
- **Limits.** Fixed windows, one counter per rule and key; a refused request counts nothing. Starting rules (one table in `limits.ts`): chat 3 a minute and 20 a day per chat, 40 a day per network; session 10 a minute per network; feedback 30 a day per network.
- **Budget.** Integer micro-USD. `reserve` holds the largest possible cost against the UTC day and month caps (defaults 500,000 and 5,000,000, set by `BUDGET_DAY_MICRO_USD` and `BUDGET_MONTH_MICRO_USD`); `settle` records the real cost and frees the rest; `release` frees all of it. A reservation not settled or released within 5 minutes is kept as spent at its reserved amount, so a failure cannot cause overspend.
- **Kill switch.** A `killed` flag in the budget object, or the `KILL_SWITCH` variable set to `true`, makes every paid request fail with 503.
- **Refusals.** Over a limit gives 429 `rate_limited` with `retryAt`; the cap or kill switch gives 503 `unavailable` with `retryAt`. The client then falls back to the built-in keyword answers. If the Guard itself cannot be reached, the request is refused rather than allowed.

Retention: a daily cron (03:17 UTC) deletes messages, feedback, events and chats past 90 days (`worker/lib/retention.ts`).

## Operating it

`npm run db:migrate:local` applies the migrations to the local database used by `wrangler dev`. For production, create the database with `wrangler d1 create guide`, put its id in `wrangler.jsonc`, and apply the migrations with `wrangler d1 migrations apply DB --remote`.
