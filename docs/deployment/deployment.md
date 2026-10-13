# Deployment

Status: the frontend deploys to Cloudflare (see below). The backend sections are still a plan: no Cloud Run service or backend container exists, and some older documents still describe the Firebase Hosting setup that Cloudflare replaced.

## Topology

Static frontend: Cloudflare Workers static assets, on the domain `yashbakshi.com` (registered at Cloudflare, so DNS, TLS and hosting are one account). The build folder is served as it is; any address that is not a file or a page shows `404.html`. See [ADR-006](../decisions/ADR-006-cloudflare-hosting.md). The backend is not built yet; when it is, keep the publication independent of its availability.

## Frontend Release

1. The site address lives in one place, `SITE` in `apps/web/vite.site.ts`. Every canonical and social-preview URL, `robots.txt` and `sitemap.xml` are generated from it at build time.
2. `apps/web/wrangler.jsonc` points Cloudflare at `./dist`, with `404-page` handling and trailing-slash handling for the case study pages (each is a real directory page, so there is no single-page fallback).
3. `workers.dev` and the public preview addresses are turned off in the same file (`workers_dev` and `preview_urls`), so the site is only reachable on its own domain. A toggle flipped in the dashboard would be undone by the next deploy, so this is set in the file. The cost: Cloudflare builds no per-pull-request preview links; GitHub's checks and the local dev server still work.
4. Security headers (a content security policy, no framing, no MIME sniffing) and one-year caching for the hashed files in `/assets/` are in `apps/web/public/_headers`.
5. Connect the GitHub repository in the Cloudflare dashboard (Workers and Pages, create, import a repository). Set the root directory to `apps/web`, the build command to `npm ci && npm run build` and the deploy command to `npx wrangler deploy`. Every pull request then gets a preview address, and a merge to `main` deploys.
6. Add the domain to the Worker as a custom domain, and check deep links, the 404 page, assets and the contact links on the live site.

## Redirect domain and renewal

The free `yashbakshi.dev` year at Name.com renews at $22.99, against $12.20 at Cloudflare. Do not let it renew at Name.com: unlock it, get the authorization code and transfer it to Cloudflare before the renewal date, then redirect it to `yashbakshi.com`.

## Backend Release

Once `apps/api/` exists: build/test a container, bind `0.0.0.0:$PORT`, push an immutable image to Artifact Registry, and deploy a Cloud Run revision with a dedicated service account. Configure Secret Manager, App Check verification, Firestore access, quota settings, and restricted origins before enabling paid inference.

Start with request-based billing and zero minimum instances; measure cold starts. Maximum instances and timeout are bounded starting settings, not a guarantee of a hard dollar cap. [Cloud Run billing](https://docs.cloud.google.com/run/docs/configuring/billing-settings), [maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances)

## Verification and Rollback

Check public page health, API health, session bootstrap, grounding, invalid action rejection, daily limits, voice fallback, and keyboard/touch behavior. Confirm managed logs meet privacy configuration.

Retain a known-good Hosting release and Cloud Run revision. Roll back both together if their content/API versions differ. Disable AI/voice independently during incidents so the publication remains available. Do not use database deletion or billing-account removal as routine rollback.

Source repository visibility is already public; the website launch remains gated until the complete experience is polished.
