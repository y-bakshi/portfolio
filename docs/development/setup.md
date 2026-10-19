# Development Setup

Requirements: Node.js 22.12 or newer and npm. The lockfile records exact dependencies. Everything lives in `apps/web/`: the React site, the Worker API in `worker/`, the tests and the scripts.

```sh
git clone https://github.com/y-bakshi/portfolio.git
cd portfolio/apps/web
npm ci
npm run dev
```

Open `http://localhost:5173`. The Vite dev server reloads the front end as you edit. It proxies `/api` to a local Worker on port 8788, so the chat only works while that is running too.

## The site with its API

```sh
cp .dev.vars.example .dev.vars     # then edit the values
npm run db:migrate:local           # creates the local database
npm run build                      # the Worker serves the built site from dist/
npm run worker:dev                 # http://localhost:8788
```

- `npm run worker:dev` starts the Worker with the bot check off, because Turnstile only works on the real domain. Without that flag, chats are refused locally.
- Port 8788 serves `dist/`. After changing front-end code, rebuild with `npm run build` and restart `worker:dev`; refreshing is not enough, and rebuilding under a running server leaves it pointing at deleted files.
- `.dev.vars` is ignored by git. It needs `SESSION_SECRET` and `HMAC_SECRET`, and `GEMINI_API_KEY` for real answers (without a key the guide says it cannot answer). Set `ADMIN_DEV_BYPASS=true` to open `/admin` on localhost without Access, and `LIMITS_DEV_BYPASS=true` to skip the question limits (the spending cap stays on). See [environment variables](environment-variables.md).
- The local database starts empty. To give the guide notes: `npm run corpus:build`, `npm run corpus:index` (with `GEMINI_API_KEY`, or `-- --mock` for fake vectors), then `npx wrangler d1 execute DB --local --file=worker/rag/chunks.generated.sql`.
- Local résumé: `npx wrangler r2 object put portfolio-files/resume.pdf --file=<pdf> --content-type application/pdf --local`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server. |
| `npm run check` | TypeScript diagnostics. |
| `npm run build` | Type check, then the production build and prerender into `dist/`. |
| `npm run format` / `format:check` | Prettier, write or check. |
| `npm test` | Vitest, React Testing Library, the Worker tests. |
| `npm run e2e` | Playwright on a desktop and a phone viewport (`npx playwright install chromium` first). |
| `npm run db:migrate:local` | Apply the migrations to the local database. |
| `npm run corpus:build` / `corpus:index` | Rebuild the notes and embed them ([rag](../architecture/rag.md)). |
| `npm run eval:record -- --mock` or `-- --live` | Run the labelled questions and save the scores for the owner page. `--live` spends money. |
| `npm run logos:copy` | Copy technology logos into `public/logos`. |

Never commit `node_modules/`, `dist/`, `.dev.vars` or `.wrangler/`. Use `npm run dev -- --host 0.0.0.0` to open the dev server from another device on the network.

## Before a commit

CI runs `format:check`, `build`, `npm test` and `npm run e2e`. Run all of them locally for anything that is not a copy-only change. Read [coding standards](coding-standards.md) and [environment variables](environment-variables.md) before adding a service or a setting.
