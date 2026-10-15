# System Architecture

## Implemented and Planned

Implemented: a React and TypeScript frontend built with Vite and styled with hand-written CSS, served as static files by a Cloudflare Worker on `yashbakshi.com`, and a Hono API in the same Worker (health check and the shared request guards). Built phase by phase on the `feature/guide-chat` branch: anonymous stored chat, retrieval-augmented answers, abuse and budget protection, usage analytics. The earlier Firebase and Cloud Run design is replaced by this one (ADR-006).

There is no current diagram. The old one (`architecture-diagram.png`, produced by `render-diagram.py`) shows Firebase Hosting and Cloud Run and is out of date.

## Components

- **Frontend:** Vite bundles the React application, CSS and optimized assets into `dist/`, which the Worker serves with Cloudflare's static assets.
- **Worker and API:** Hono under `/api` in the same Worker: sessions, chat, feedback, a small owner-only admin view. Same origin, so no CORS.
- **Database:** Cloudflare D1 for chats, messages, feedback, events and chunk text. See the database design.
- **Retrieval:** a build script turns the content modules into chunks, embeds them with Workers AI and stores the vectors in Vectorize. A question is embedded, the nearest chunks are retrieved, and the model answers from them and cites their ids.
- **Models:** a thin `LlmProvider` interface with adapters (Gemini for answers, Workers AI for embeddings and as a fallback), reached through Cloudflare AI Gateway for logging, caching and provider fallback.
- **Rate limits and budget:** a Durable Object holds the counters; Turnstile guards the first message.
- **Knowledge artifact:** one versioned content source feeds both the rendered pages and the retrieval index, so they cannot drift.

## Request Boundaries

Browsers request public pages with no authentication. The paid chat endpoint requires the anonymous chat cookie, a verified bot check on the first message, the origin check, and the rate and budget admission before any provider is called. Clients receive text, citations that name cards on the page, and nothing executable.

Because the API is under the site's own domain, there is no cross-origin traffic and no extra hostname. Keep requests short and stream answers so the first words arrive quickly.

## State and Navigation

Use stable project IDs and canonical routes. Keep assistant state in focused React components. Each case study is its own static HTML page, so it has its own title and social preview tags and needs no client-side router or rewrite rule; section links use plain `#` anchors. The chat transcript is stored on the server under an anonymous id and mirrored in the browser, so a refresh restores it; the visitor is told this and can delete it.

## Failure Behavior

Quota-store failure: deny paid requests. Provider failure: return a clear recoverable error and keep publication navigation available. Unsupported speech: offer text. Invalid action or unknown citation: discard it and do not move the page. Global budget exhausted: disable new paid requests until reset or owner intervention.
