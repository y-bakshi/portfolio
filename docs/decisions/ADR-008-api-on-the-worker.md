# ADR-008: Build the API as a Hono app in the site's Worker

Status: accepted. Date: 2026-10-19. Replaces the FastAPI backend planned in [ADR-001](ADR-001-frontend-framework.md) and [ADR-004](ADR-004-react-vite-frontend.md).

## Context

The guide needs a small server: sessions, chat, feedback, an owner-only admin view and a résumé download. The first plan was a separate Python FastAPI service on Cloud Run, behind Firebase Hosting. [ADR-006](ADR-006-cloudflare-hosting.md) then moved hosting to Cloudflare, where the site is already served by a Worker. No document compared API frameworks; this record writes down the reasoning after the fact.

## Decision

Run the API inside the same Worker that serves the site, written in TypeScript with the Hono framework. Only addresses under `/api`, `/admin` and `/resume.pdf` run code (`assets.run_worker_first`); every other address is served as a file. The shared steps (origin check, body size limit, request id, error shape) are Hono middleware in `worker/app.ts`, and the routes are in `worker/routes/`.

## Why

- **One language, shared code.** The Worker imports the same TypeScript content, notes and types as the site, so nothing is copied and a change to a type fails the build in both places.
- **Same origin.** The API is on the site's own domain, so there is no CORS, no second hostname, and the chat cookie can be `Secure`, `HttpOnly` and `SameSite`.
- **Bindings are typed.** D1, R2, the Durable Object and the secrets reach the code through one typed `Env`. A wrong name is a compile error.
- **Fast start, small size.** A Worker starts per request and Hono is a few kilobytes.
- **One deploy and one test setup.** A merge deploys site and API together, and Vitest covers both.

## Alternatives

- **FastAPI on Cloud Run (the earlier plan):** familiar Python, and suits heavy libraries or long jobs. It needs a container, a second service to deploy and secure, and either CORS or a rewrite rule. Rejected when hosting moved to Cloudflare.
- **Python Workers:** possible, but when this was decided they were beta, with start-up and package limits. Worth checking again if a Python library becomes necessary.
- **Rust on Workers (WebAssembly):** fast, but a slower build, less convenient bindings, and no shared TypeScript.
- **Plain Worker code with no framework, or Express:** a hand-written router and error handling for plain code, and a Node server that Workers do not run for Express.

## Consequences

- The API is TypeScript, so it shows full-stack range but not the Java and Python backends on the CV. TestPilot and CV Studio show FastAPI.
- A Worker is the wrong place for heavy compute or long jobs. If the guide ever needs them, the Worker should call a separate service.
- Older documents that mention FastAPI, Cloud Run and Firebase describe the abandoned plan.
