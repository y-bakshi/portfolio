# API Design

Status: proposed v1 contract; no backend routes exist. FastAPI's generated OpenAPI schema will become the machine-readable contract when implemented.

## Endpoints

| Method / path | Purpose | Protection |
| --- | --- | --- |
| `GET /api/v1/health` | Lightweight readiness, no provider calls or internal configuration. | Public; cheap. |
| `POST /api/v1/session` | Issue short-lived signed anonymous session cookie. | App Check plus network burst limit. |
| `POST /api/v1/chat` | Return grounded answer, citations, actions, usage. | App Check, session, all quota/budget checks, idempotency. |
| `GET /api/v1/usage` | Current allowance/reset; never expose other sessions. | App Check and session; separate cheap-request limit. |
| `POST /api/v1/feedback` | Submit optional `helpful` or `unhelpful` rating. | App Check, session, feedback limit. |
| `POST /api/v1/speech` | Optional speech synthesis for server-authorized answer IDs. | App Check, session, voice budget; only if server TTS is selected. |

Every protected call includes `X-Firebase-AppCheck`. Session cookie is `Secure`, `HttpOnly`, and `SameSite=Lax`, scoped to the same origin. Mutations verify `Origin`; CORS is not an authentication mechanism. Paid calls use `Idempotency-Key` to prevent duplicate charges. Tokens, keys, and prompts must not appear in URLs or logs.

## Chat Example

```json
{
  "message": "How does TestPilot use RAG?",
  "detail": "brief",
  "currentPath": "/",
  "history": []
}
```

```json
{
  "requestId": "req_example",
  "answer": "TestPilot retrieves coding-standard chunks to ground test-generation prompts.",
  "citations": [{"projectId": "testpilot", "path": "/projects/testpilot/", "label": "TestPilot architecture"}],
  "actions": [{"type": "spotlight_project", "projectId": "testpilot"}],
  "usage": {"remainingQuestions": 8, "resetAt": "2026-09-28T00:00:00Z"}
}
```

The allowance above is illustrative; final quotas depend on provider costs. `detail` accepts `brief` or `technical`. Proposed validation: message ≤2,000 characters, history ≤6 text turns, bounded total input tokens and response tokens. Treat history as untrusted context, not evidence of user identity or authority.

Allowed actions: `spotlight_project` and `offer_case_study`, each with a known project ID. Resolve links from the content registry; never accept arbitrary URLs, selectors, scripts, or HTML from the model. The client offers navigation rather than automatically opening a case-study route.

## Errors and Cancellation

Return `{ "error": { "code": "daily_limit", "message": "…", "retryAt": "…" }, "requestId": "…" }` with 400 for malformed input, 401 for expired/missing session, 403 for failed attestation/origin, 413 for oversized payload, 422 for invalid fields, 429 for quotas, and 503 for unavailable dependencies. Omit `retryAt` when unknown. Include `Retry-After` where meaningful.

No automatic retries for paid calls without the same idempotency key. Cancellation stops UI/audio; it may not stop already incurred provider cost. Initial chat uses bounded JSON responses; streaming and audio upload require a separate contract decision. Signed short-lived answer handles for feedback/speech must be ownership-checked server-side before use.
