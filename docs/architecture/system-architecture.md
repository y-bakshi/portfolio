# System Architecture

## What is built

A React and TypeScript front end, built with Vite and styled with Tailwind v4 and shadcn/ui, served as static files by one Cloudflare Worker on `yashbakshi.com`. The same Worker runs a Hono API ([ADR-008](../decisions/ADR-008-api-on-the-worker.md)) behind the guide: anonymous stored chat, retrieval-augmented answers, abuse and budget protection, usage analytics and an owner page. The earlier Firebase, Cloud Run and FastAPI design was replaced ([ADR-006](../decisions/ADR-006-cloudflare-hosting.md)).

## Components

- **Front end.** Vite builds several real HTML pages (home, projects, a case study, experience, contact, privacy, chat, 404) into `dist/`. A prerender step draws each to static HTML with its own title, description and structured data, so crawlers and no-script visitors get the content. The Worker serves `dist/` as Cloudflare static assets.
- **Worker and API.** Hono handles only `/api/*`, `/admin`, `/admin/*`, `/resume.pdf` and `/cv`; everything else is a file. Same origin as the site, so no CORS. Routes are listed in [API design](api-design.md).
- **D1 database.** Chats, messages, feedback, events, the notes with their vectors, saved answers and saved evaluation runs ([database design](database-design.md)).
- **Durable Object `Guard`.** The rate-limit counters and the spend total.
- **R2 bucket.** The résumé PDF, served at `/resume.pdf` (download) and `/cv` (opens in the browser), kept out of git.
- **Retrieval.** A script turns the content modules and a short list of approved facts into notes, embeds them with Gemini and loads them into D1. A question is embedded, the closest notes are found, and the model answers from them and cites their ids ([retrieval](rag.md), [ADR-010](../decisions/ADR-010-retrieval-and-evaluation.md)).
- **Models.** A thin provider interface with a Gemini adapter (answers and embeddings), a Workers AI adapter (optional fallback, off) and a mock for tests.
- **Protection.** Turnstile on session creation, a signed `chat` cookie, per-chat and per-network limits, a spending cap and a kill switch ([ADR-009](../decisions/ADR-009-data-and-abuse-protection.md), [protection](../deployment/protection.md)).
- **Owner page.** `/admin`, behind Cloudflare Access, with six tabs: overview, page analytics (Cloudflare's own traffic numbers), AI usage, questions, answer quality and cost and safety ([analytics](../deployment/analytics.md)).
- **Knowledge source.** One content source feeds both the rendered pages and the retrieval notes, so they cannot drift.

The file layout is in the repository's `apps/web/` folder: `src/` (the website), `worker/` (the API), `e2e/`, `eval/`, `scripts/` and `public/`.

## Request boundaries

Browsers request public pages with no authentication. The paid chat endpoint needs the anonymous chat cookie (issued after a bot check), the origin check, and rate and budget admission before any model is called. Clients receive text, citations that name cards on the page, and nothing executable. `/admin` and `/api/admin/*` need an Access login and the Worker checks the token again.

Because the API is on the site's own domain there is no cross-origin traffic. Answers stream over server-sent events so the first words arrive quickly.

## State and navigation

Project ids and routes are stable. Each case study is its own static page, so there is no client-side router and no rewrite rule; section links use `#` anchors. Chat state lives in focused React components. On a phone the chat is a page of its own (`/chat/`) and the launcher shrinks to the mascot while scrolling. The transcript is stored on the server under an anonymous id and mirrored in the browser, so a refresh restores it; the visitor is told this and can delete it.

## Failure behavior

- A failing quota store denies paid requests; the static site keeps working.
- If the model path fails, the guide says it cannot answer just now and points to the projects and the contact block. Nothing is stored for that reply, and there is no weaker second guide.
- An invalid action or unknown citation is dropped.
- When the daily or monthly cap is reached, new paid answers stop until the next UTC day or month; the kill switch does the same on demand.
- If Cloudflare's analytics refuse a query, the owner page shows that panel as unavailable and the rest still loads.
