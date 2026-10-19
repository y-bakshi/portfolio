# Environment Variables

Settings come from three places: public values in `apps/web/wrangler.jsonc` (`vars`), secrets stored in Cloudflare with `wrangler secret put` (and in `.dev.vars` on a developer's machine), and one build variable for the front end. The Worker's typed list is `worker/env.ts`.

## Secrets (Cloudflare secrets, or `.dev.vars` locally)

| Name | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key for answers and embeddings. Without it the guide says it cannot answer. |
| `SESSION_SECRET` | Signs the `chat` cookie. |
| `HMAC_SECRET` | Keys the daily-rotating hash that stands in for an IP address. Guarded routes refuse every request without it. |
| `TURNSTILE_SECRET` | Verifies bot-check tokens. |
| `CF_ANALYTICS_TOKEN` | Read-only Cloudflare token (Zone, Analytics, Read) for the owner page's traffic. |
| `KILL_SWITCH` | Optional. `true` stops all paid answers at once. |

Never put a secret in the repository, in a `VITE_` variable or in a chat. `.dev.vars.example` lists the local ones.

## Variables (`wrangler.jsonc`)

| Name | Value now | Purpose |
| --- | --- | --- |
| `SITE_ORIGIN` | `https://yashbakshi.com` | The origin allowed to change anything. |
| `LLM_PROVIDER` | `gemini` | `gemini`, `workers-ai` or `mock`. Unset means the guide says it cannot answer. |
| `REQUIRE_TURNSTILE` | `true` | Require the bot check. Without a secret the check is skipped unless this is `true`. |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | the Access team and audience tag | The owner page refuses everything if either is missing. |
| `CF_ZONE_ID` | the zone id | Which zone's traffic to read. Empty means traffic is not set up. |
| `BUDGET_DAY_MICRO_USD`, `BUDGET_MONTH_MICRO_USD` | defaults 500,000 and 5,000,000 | Spending caps in millionths of a dollar. |
| `GEMINI_MODEL`, `RAG_MIN_SCORE`, `RAG_CONTACT_MIN_SCORE` | unset | Overrides for the model and the retrieval thresholds. |
| `ADMIN_DEV_BYPASS`, `LIMITS_DEV_BYPASS` | unset | Local only: skip Access or the question limits, on localhost requests only. Never set in production. |

Bindings (not variables): `ASSETS`, `DB` (D1), `GUARD` (Durable Object), `FILES` (R2). `AI` and `VECTORIZE` are optional and commented out.

## Front-end build

| Name | Purpose |
| --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Public Turnstile site key. Set in the Cloudflare build settings; without it the page never loads the check and the chat cannot start. |

Variables starting with `VITE_` are public. Changing one needs a rebuild.

## Local overrides

`npm run worker:dev` passes `--var REQUIRE_TURNSTILE:false`, so chats work locally. `.env` files are ignored by git.
