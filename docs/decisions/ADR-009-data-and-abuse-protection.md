# ADR-009: Keep data in D1 and guard the chat with Cloudflare services

Status: accepted. Date: 2026-10-19. Supersedes [ADR-002](ADR-002-database-choice.md) (Firestore) and [ADR-003](ADR-003-authentication.md) (App Check).

## Context

Every answer costs money, so the chat endpoint needs abuse protection, limits that hold across requests, and a spending ceiling. Visitors must not need an account. The earlier decisions assumed Firebase and Google Cloud; the site now runs on Cloudflare ([ADR-006](ADR-006-cloudflare-hosting.md), [ADR-008](ADR-008-api-on-the-worker.md)).

## Decision

- **Data in D1.** Chats, messages, feedback, events, the notes with their vectors, saved answers for the suggestion buttons, and saved evaluation runs live in one D1 database, created by numbered migrations in `worker/migrations/`.
- **Counters in a Durable Object.** Rate-limit counters and the spend total live in one Durable Object (`Guard`), which serialises updates so two requests cannot both spend the last of the budget.
- **Bot check.** Cloudflare Turnstile guards session creation. A visitor without a valid token cannot start a chat.
- **Anonymous session.** A signed `chat` cookie ties a browser to its own chat. It is not an identity and clearing it starts a new chat. The cookie renews each time it is used (90 days after the last use, 180 at most), so a regular visitor keeps their chat. See the update below for how it relates to the bot check.
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

## Update, November 2026: the chat and the bot check are separate

The first version used the cookie for two things at once: it kept the visitor's chat, and its presence was the proof that the bot check had passed. When the cookie expired or was cleared, a returning visitor lost both, the page did not notice (it judged by old answers saved in the browser), and every question was refused with a 403. The guide showed "cannot answer just now" and the model was never called.

The two are now separate. The cookie holds the chat id, when the session began, and until when the bot check counts. The id renews with use and is the visitor's chat. The check counts for a day, then lapses and is asked for again without losing the chat. Only `POST /api/session` makes the check. A question with no check on record is refused first, before any limit or spend is touched, with the code `verification_required`; the page runs the check and asks once more. The server, not the browser's saved copy, decides. Refusals and failed checks are recorded as events and shown on the owner page.

Consequences: a returning visitor never sees an error for an expired cookie, and a lapsed check is invisible to them. The cookie lives longer (90 days after the last use, 180 at most), which the privacy page states. The check is only as strong as before: it slows bots, and the limits and the spending cap remain the real protection.
