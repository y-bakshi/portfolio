# Deployment

Status: the site and its API are live on Cloudflare at `yashbakshi.com`. A merge to `main` deploys both. This page describes how, and how to set up what a fresh account needs.

## Topology

One Cloudflare Worker named `portfolio` serves the static site (Workers static assets, from `apps/web/dist`) and the API ([ADR-008](../decisions/ADR-008-api-on-the-worker.md)). Only `/api/*`, `/admin`, `/admin/*` and `/resume.pdf` run Worker code (`assets.run_worker_first`); every other address is a file. Around the Worker: a D1 database (`guide`), a Durable Object (`Guard`), an R2 bucket (`portfolio-files`), Turnstile, Access and a read-only analytics token. The diagram is in [system-architecture](../architecture/system-architecture.md). The domain is registered at Cloudflare, so DNS, TLS and hosting are one account ([ADR-006](../decisions/ADR-006-cloudflare-hosting.md)).

## Release

1. **Change reaches `main`.** Work happens on a branch and a pull request. CI ([ci-cd.md](ci-cd.md)) must pass.
2. **Cloudflare builds it.** The Worker is connected to the GitHub repository (Workers and Pages). Root directory `apps/web`, build command `npm ci && npm run build`, deploy command `npx wrangler deploy`. The build also draws each page to static HTML and writes `robots.txt`, `sitemap.xml`, the structured data and `llms.txt` ([seo.md](seo.md)).
3. **Build variable.** `VITE_TURNSTILE_SITE_KEY` (public) is set under the Worker's Settings, Build, Variables, because the page loads the bot check only when it is built with the key. `NODE_VERSION` is 22.
4. **Live in about two minutes.** `wrangler.jsonc` is the source of truth for bindings and variables; a setting changed in the dashboard that the file also sets is overwritten by the next deploy.

## One-time setup in a new account

From `apps/web` after `npx wrangler login`:

| Step | Command or place |
| --- | --- |
| Database | `npx wrangler d1 create guide`, put the id in `wrangler.jsonc`, then `npx wrangler d1 migrations apply DB --remote` |
| Notes index | `npm run corpus:build`, then `GEMINI_API_KEY=... npm run corpus:index`, then `npx wrangler d1 execute DB --remote --file=worker/rag/chunks.generated.sql` |
| Résumé | Enable R2 in the dashboard, then `npx wrangler r2 bucket create portfolio-files` and `npx wrangler r2 object put portfolio-files/resume.pdf --file=<pdf> --content-type application/pdf --remote` |
| Secrets | `npx wrangler secret put` for `GEMINI_API_KEY`, `SESSION_SECRET`, `HMAC_SECRET`, `TURNSTILE_SECRET` and `CF_ANALYTICS_TOKEN` (each asks for the value; do not paste secrets into chats or commits) |
| Bot check | A Turnstile widget for the domain (see [protection](protection.md)) |
| Owner page | An Access application for `/admin`, `/admin/*` and `/api/admin/*`, with the team domain and audience tag in `wrangler.jsonc` (see [analytics](analytics.md)) |
| Domain | Add the domain to the Worker as a custom domain; check deep links, the 404 page, assets and the contact links |

Zero Trust is on its Free plan. Check which plan the account has for Workers, D1, Durable Objects and R2 and what their allowances are; the only usage known to cost money is the Gemini key (see [infrastructure](infrastructure.md)).

## Redirect domain and renewal

The free `yashbakshi.dev` year at Name.com renews at $22.99, against $12.20 at Cloudflare. Do not let it renew at Name.com: unlock it, get the authorization code and transfer it to Cloudflare before the renewal date, then redirect it to `yashbakshi.com`.

## Previews

`workers_dev` and `preview_urls` are off, so there is no public address other than the domain. A preview address would run the real Worker with the real database and key. To turn previews back on, put Cloudflare Access in front of them first, then set `preview_urls` to `true`.

## Verification and rollback

After a deploy: the pages and `/resume.pdf` return 200, `GET /api/health?db=1` says the database answers, `/admin` redirects to the Access login, an unknown address shows the 404 page, and a real chat question is answered in a browser (the bot check needs one).

To undo a bad deploy, redeploy an earlier commit from the Cloudflare dashboard (Deployments) or revert on `main`. To stop paid answers at once without a deploy, set the `KILL_SWITCH` secret to `true` (`npx wrangler secret put KILL_SWITCH`); the static site keeps working. Applying a migration is not undone by redeploying code, so keep migrations additive.
