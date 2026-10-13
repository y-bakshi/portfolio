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
- Some older documents still mention Firebase Hosting and Cloud Run. They describe the unbuilt backend and should be revised when it is designed.
