# ADR-006: Host the frontend on Cloudflare

Status: accepted, October 2026.

## Context

The site is static files: the home page, an all-projects page, a case study page and a not-found page. The earlier plan was Firebase Hosting in front of a Cloud Run API. A domain was needed, and the owner prefers pay-for-use services over a server to maintain.

## Decision

Serve the build folder from Cloudflare Workers static assets, on a domain registered at Cloudflare.

## Why

- Static files cost nothing on the free plan and are not capped.
- Cloudflare sells domains at the wholesale price with the same price on renewal, and DNS, TLS and hosting sit in one account.
- Pull requests get preview addresses, and a merge to `main` deploys, as with the alternatives.
- A backend can be added later as a Worker or as a separate service on the same domain.

## Alternatives considered

- **Vercel:** equally simple, but the free plan is for personal, non-commercial use.
- **Hostinger:** paid, aimed at WordPress-style hosting, and renewal prices rise sharply after the introductory term.
- **A VPS:** a fixed monthly cost and a server to maintain, with nothing yet to run on it. It makes sense later for always-on personal tools.

## Consequences

- The site address is set once in `apps/web/vite.site.ts`.
- Some older documents still mention Firebase Hosting and Cloud Run. They describe the abandoned backend plan.

## Update, October 2026

- The backend was built as an API in the same Worker ([ADR-008](ADR-008-api-on-the-worker.md)), with its data and protection in [ADR-009](ADR-009-data-and-abuse-protection.md). The Worker now also runs a daily cleanup job.
- The "pull requests get preview addresses" point no longer holds. `workers_dev` and `preview_urls` are off in `wrangler.jsonc`, because a preview address would run the real Worker, with the real database and key. Branch previews can come back once they sit behind Cloudflare Access.
