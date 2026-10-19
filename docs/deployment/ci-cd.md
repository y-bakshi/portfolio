# CI/CD

Status: implemented. `.github/workflows/ci.yml` runs on every pull request and on pushes to `main`. A merge to `main` is deployed by Cloudflare's own build, not by GitHub Actions.

## Pull request checks

Two jobs, both on Node 22 with the npm cache, working in `apps/web`:

- **Format, types, build, unit tests:** `npm ci`, `npm run format:check`, `npm run build` (which runs `tsc --noEmit` first, then the Vite build and the prerender), then `npm test` (Vitest).
- **Browser tests:** `npm ci`, `npx playwright install --with-deps chromium`, `npm run e2e` (Playwright on a 1280 px desktop and a 375 px phone). On failure the Playwright traces are kept for seven days.

Neither job needs a secret. The unit tests use mock models and an in-memory SQLite, and the browser tests run against the dev server. Live evaluation runs (`npm run eval:record -- --live`) are not part of CI because they spend money.

A pull request should only be merged when both checks pass. The checks are not enforced by a branch rule yet; add one in the repository settings if more than one person will merge.

## Release

On a merge to `main`, Cloudflare builds and deploys ([deployment](deployment.md)). The CI run on that same commit is a second check, not a gate. Cloudflare may also build other branches as uploaded versions; they are not live and have no public address, because `preview_urls` is off.

Migrations are applied by hand with `npx wrangler d1 migrations apply DB --remote`, before the code that reads them goes live. A Worker endpoint that reads a new table should tolerate it being absent, as `/api/admin/evals` does.

The notes index is not rebuilt by deploys. After a change to a note, rebuild and re-embed it ([rag.md](../architecture/rag.md)).

## Permissions and evidence

The workflow has no deployment credentials, so a pull request from a fork cannot reach production. Keep it that way: never add Cloudflare or Gemini secrets to GitHub Actions without a protected environment. Test evidence is the CI run for the commit.
