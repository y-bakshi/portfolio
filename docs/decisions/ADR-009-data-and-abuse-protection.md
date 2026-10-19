# ADR-009: Keep data in D1 and guard the chat with Cloudflare services

Status: accepted. Date: 2026-10-19. Supersedes [ADR-002](ADR-002-database-choice.md) (Firestore) and [ADR-003](ADR-003-authentication.md) (App Check).

## Context

Every answer costs money, so the chat endpoint needs abuse protection, limits that hold across requests, and a spending ceiling. Visitors must not need an account. The earlier decisions assumed Firebase and Google Cloud; the site now runs on Cloudflare ([ADR-006](ADR-006-cloudflare-hosting.md), [ADR-008](ADR-008-api-on-the-worker.md)).

## Decision

- **Data in D1.** Chats, messages, feedback, events, the notes with their vectors, saved answers for the suggestion buttons, and saved evaluation runs live in one D1 database, created by numbered migrations in `worker/migrations/`.
- **Counters in a Durable Object.** Rate-limit counters and the spend total live in one Durable Object (`Guard`), which serialises updates so two requests cannot both spend the last of the budget.
- **Bot check.** Cloudflare Turnstile guards session creation. A visitor without a valid token cannot start a chat.
- **Anonymous session.** A signed, 30 day `chat` cookie ties a browser to its own chat. It is not an identity and clearing it starts a new chat.
- **Network buckets.** To limit one connection without storing its address, the Worker uses a keyed hash of the address that changes every day.
- **Limits and cap.** Per chat 20 questions a minute and 60 a day, per network 150 a day, 10 new sessions a minute. A global cap of $0.50 a day and $5 a month; each answer reserves up to $0.005 before the model is called and settles to the real cost. A kill switch stops every paid answer at once.
- **Retention.** Saved chats, messages and events are deleted after 90 days by a daily scheduled job, and a visitor can delete their own chat at any time.
- **Owner view.** `/admin` sits behind Cloudflare Access, limited to the owner's email, and the Worker checks the Access token itself as well.

## Alternatives

- **Firestore and App Check (the earlier plan):** workable, but a second vendor and identity layer once the site is on Cloudflare.
- **In-memory counters:** do not survive restarts or coordinate across instances.
- **Mandatory login:** adds friction for recruiters, who are the main visitors.
- **KV for counters:** eventually consistent, so a burst could pass the limits.

## Consequences

- Limits use fixed windows, so a burst at a window boundary can briefly reach twice the limit. The spending cap still bounds the cost.
- Network limits can affect people sharing one connection, and do not stop a large distributed attack. The cap is the backstop, and it can also be used up by an attacker, which stops the guide for real visitors until the next day or month.
- The caps live in the Worker. They do not protect a stolen Gemini key, so the key stays a Worker secret and a budget alert should be set on Google's side.
- The privacy page describes what is stored and for how long, and must change when this does.
