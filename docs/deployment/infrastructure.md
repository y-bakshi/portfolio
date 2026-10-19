# Infrastructure

Status: provisioned in one Cloudflare account, plus a Gemini API key. The earlier plan (Firebase Hosting, Cloud Run, Firestore, Secret Manager, App Check) was replaced; see [ADR-006](../decisions/ADR-006-cloudflare-hosting.md), [ADR-008](../decisions/ADR-008-api-on-the-worker.md) and [ADR-009](../decisions/ADR-009-data-and-abuse-protection.md).

| Resource | Responsibility | Notes |
| --- | --- | --- |
| Workers (static assets) | Serves the built site; runs the API only on `/api`, `/admin` and `/resume.pdf`. | One Worker, `portfolio`. Deployed from `main`. |
| D1 `guide` | Chats, messages, feedback, events, the notes and their vectors, saved answers, saved evaluations. | Migrations in `worker/migrations/`. Chats and events are deleted after 90 days by a daily job. |
| Durable Object `Guard` | Rate-limit counters and the spend total. | SQLite-backed; four named objects. |
| R2 `portfolio-files` | The résumé PDF, served at `/resume.pdf`. | Kept out of git because it holds a phone number. |
| Turnstile | Bot check on session creation. | Site key is public and a build variable; the secret key is a Worker secret. |
| Access (Zero Trust Free) | Login for `/admin`. | Limited to the owner's email; the Worker also checks the token. |
| Zone analytics | Traffic numbers for the owner page. | A read-only API token scoped to the one zone. |
| Gemini API | Answers and embeddings. | The usage known to cost money. The key is a Worker secret. |

## Budget controls

Gemini is the cost this site controls. The Worker enforces a global cap of $0.50 a day and $5 a month (`BUDGET_DAY_MICRO_USD`, `BUDGET_MONTH_MICRO_USD`), reserves up to $0.005 per answer before calling the model, limits questions per chat and per network, and has a kill switch. See [protection](protection.md).

Those caps live in the Worker and do not cover a leaked key, so also set a budget alert on the key in Google AI Studio or Cloud. An alert warns but does not stop spending.

A live evaluation run makes about 240 paid calls and costs a few cents. The Cloudflare services are small at this scale, but confirm the account's plan and the allowances for Workers, D1, Durable Objects and R2 in the dashboard, and watch them if traffic grows.

## Provisioning

Everything is created by hand with the Wrangler CLI and the dashboard, as listed in [deployment](deployment.md). Bindings and variables are declared in `apps/web/wrangler.jsonc`. There is no Terraform. If the setup is ever repeated often or in several accounts, writing it as code would be worth the effort; for one site it is not.
