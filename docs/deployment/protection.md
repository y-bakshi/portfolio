# Abuse and cost protection: setup

The chat endpoint is public and each answer costs money, so it is guarded by a bot check (Cloudflare Turnstile), rate limits, a spending cap and a kill switch. This page lists what the owner sets up.

## One-time setup

1. **Turnstile widget.** In the Cloudflare dashboard open Turnstile, add a widget for `yashbakshi.com` (managed mode). Copy the site key and the secret key.
2. **Secrets.** From `apps/web`:
   - `npx wrangler secret put TURNSTILE_SECRET` (the Turnstile secret key).
   - `npx wrangler secret put HMAC_SECRET` (any long random string, for example from `openssl rand -hex 32`). Without it the guarded routes refuse every request.
3. **Require the check.** Add `"REQUIRE_TURNSTILE": "true"` to `vars` in `wrangler.jsonc`. If this is not set and the secret is missing, the check is skipped (fine for local work only).
4. **Site key.** The page loads the check only when it is built with the site key. It is public, not a secret. Set `VITE_TURNSTILE_SITE_KEY` in the environment where the site is built: for the Cloudflare build, add it under the Worker's Settings, Build, Variables (the same place as `NODE_VERSION`); locally, put it in a `.env.local` file in `apps/web`. The page then asks Cloudflare for a one-use token (the check shows itself only if it needs the visitor to do something) and sends it with the first request that starts a chat. A new visitor must pass the check whichever route they arrive by, and the cookie that follows proves they did.
5. **Deploy.** `npm run build`, then `npx wrangler deploy`. The first deploy creates the `Guard` Durable Object (migration `v1-guard`) and the daily cron.

For local work, put `HMAC_SECRET=anything` in `apps/web/.dev.vars`. Leave `TURNSTILE_SECRET` out and the check is skipped.

## Changing the caps

Spending caps are in millionths of a US dollar. Defaults: 5,000,000 a month (5 dollars) and 500,000 a day. Set `BUDGET_MONTH_MICRO_USD` and `BUDGET_DAY_MICRO_USD` under `vars` in `wrangler.jsonc` and deploy. Request limits (3 a minute and 20 a day per chat, 40 a day per network, and the session and feedback limits) are one table in `worker/lib/limits.ts`.

## Kill switch

Two ways, either one stops every paid answer at once:

- **Instant, no storage needed:** set `KILL_SWITCH` to `true` (`npx wrangler secret put KILL_SWITCH`, or a `vars` entry) and deploy. Set it back to `false` or delete it to resume.
- **Stored flag:** the `killed` flag in the `budget` Guard object, set through `setKilled` in `worker/lib/guard-client.ts` (an admin route can call it later).

The monthly cap is a kill switch that flips itself: when the month's settled and reserved spend would pass the cap, the guide rests until the first of the next month (UTC). The daily cap works the same until the next UTC day.

## What visitors see

- Too many questions: the API answers 429 with a plain message and the time to retry, for example "That is a lot of questions in a short time. Please try again in about a minute. The project, experience and contact pages are still open."
- Cap reached or kill switch on: 503 with "The guide is resting ... The project, experience and contact pages are still open." The page keeps working; the guide says it cannot answer just now.
- The Turnstile check fails: 403 from the chat routes.

## Privacy

No IP address is stored or logged. Limits use a keyed hash of the address and a salt that changes every UTC day, held only in the Guard object. Saved questions, answers, feedback and events are deleted after 90 days by the daily cron.
