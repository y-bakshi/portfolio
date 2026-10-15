# API Design

Status: the Worker, `/api/health`, the shared guards (request id, origin check, body limit, error format) and the stored anonymous chat (`/api/session`, `/api/chat` GET, POST and DELETE, `/api/feedback`, answered by the keyword guide) are implemented. The remaining routes are added phase by phase on the `feature/guide-chat` branch; this page is the contract they follow.

The API is a Hono app inside the same Cloudflare Worker that serves the site (`apps/web/worker/`). Only addresses under `/api` run code (`assets.run_worker_first`); every other address is served as a static file, so the API is same-origin: no CORS and the same cookie.

## Endpoints

| Method / path        | Purpose                                                                                 | Protection                                             |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET /api/health`    | Readiness. `?db=1` also checks the database. No provider calls, no configuration shown. | Public; cheap.                                         |
| `POST /api/session`  | Verify the bot check and set the anonymous chat cookie.                                 | Turnstile token, network burst limit, origin check.    |
| `GET /api/chat`      | Return this visitor's saved transcript, so a refresh restores the chat.                 | Chat cookie.                                           |
| `POST /api/chat`     | Ask a question; the answer streams back over server-sent events.                        | Chat cookie, all rate and budget checks, origin check. |
| `DELETE /api/chat`   | Delete this visitor's chat and its messages.                                            | Chat cookie, origin check.                             |
| `POST /api/feedback` | A thumbs up or down on one answer.                                                      | Chat cookie, ownership check, feedback limit.          |
| `GET /api/admin/*`   | Owner-only usage summary.                                                               | Cloudflare Access token, checked in the Worker.        |

## Rules for every route

- Every response carries `x-request-id` and `cache-control: no-store`.
- A request that can change something (any method other than GET, HEAD or OPTIONS) must carry an `Origin` header equal to the site's own origin, or `SITE_ORIGIN`. CORS is not an authentication mechanism.
- Request bodies are limited to 8 KB. A chat message is at most 1,000 characters, and at most the last 6 turns of history are used. History is untrusted context.
- The chat cookie is `chat`: a random 128-bit id, signed, `Secure`, `HttpOnly`, `SameSite=Lax`, 30 days. It identifies a chat, never a person. Clearing it starts a new chat but does not reset the rate limits.
- Tokens, keys and prompts never appear in URLs or logs.

## Chat

```json
{ "message": "How does TestPilot use RAG?" }
```

The response is `text/event-stream` with these events: `meta` (message ids), `token` (a piece of the answer), `done` (the full answer, `cites`, the usage allowance) and `error`. `cites` holds ids of cards on the page (a project, role or degree), checked against the content registry; the client shows them as "Show on the page" buttons. If the answer cannot be grounded, the text says it is not in the notes and `cites` is empty.

`GET /api/chat` returns `{ messages: [{ id, role, text, cites, createdAt }] }`, oldest first.

## Errors

`{ "error": { "code": "rate_limited", "message": "…", "retryAt": "…" }, "requestId": "…" }` with 400 for malformed input, 401 for a missing or invalid session, 403 for a failed origin or bot check, 404 for an unknown address, 413 for an oversized body, 429 for limits, and 503 for an unavailable dependency. `retryAt` is omitted when unknown; `Retry-After` is sent where meaningful. An unexpected failure returns 500 with no detail about the cause, which stays in the logs under the same request id.

When the API cannot answer (down, rate-limited, budget spent) the client falls back to the built-in keyword guide, so the chat never shows an error wall.
