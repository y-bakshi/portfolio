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

Money is stored as integer millionths of a dollar. Timestamps are integer milliseconds (UTC).

## Privacy and retention

- A visitor is never identified. A test checks that no column looks like an IP, email, phone, account or name.
- Questions are redacted before they are stored: emails, phone-like numbers and long digit runs are masked, and the length is capped.
- The chat panel tells visitors that questions and answers are saved anonymously for 90 days. A visitor can delete their chat at any time (`DELETE /api/chat`).
- A daily scheduled job deletes chats, messages, feedback and events older than 90 days.
- Rate-limit identifiers are HMACs of the network address plus a daily rotating salt. They live only in the rate-limit Durable Object for the length of the enforcement window and never in D1.

## Rate limits and budget

A Durable Object (one per limit scope) keeps the counters, because D1 is not suited to atomic counters under concurrent requests. The global spend counter reserves the largest possible cost before a provider is called, settles the real cost afterwards, and keeps a reservation if the outcome is unknown, so a failure cannot cause overspend. Reaching the monthly cap turns the guide over to the built-in keyword answers until the next month.

## Operating it

`npm run db:migrate:local` applies the migrations to the local database used by `wrangler dev`. For production, create the database with `wrangler d1 create guide`, put its id in `wrangler.jsonc`, and apply the migrations with `wrangler d1 migrations apply DB --remote`.
