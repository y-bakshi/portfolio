# System Architecture

## Implemented and Planned

Implemented: React + TypeScript frontend built with Vite and styled with hand-written CSS. Planned: reviewed project content, AI guide, FastAPI service, Firestore, provider adapters, App Check, and cloud deployment.

![Planned architecture: browser reads static publication from Firebase Hosting; assistant calls Cloud Run, which validates access, retrieves verified content, reserves quota in Firestore, and calls model and optional speech providers.](architecture-diagram.png)

The diagram is reproducible with `python3 docs/architecture/render-diagram.py` using Matplotlib. Dashed or explicitly planned components are not evidence of deployed services.

## Components

- **Frontend:** Vite bundles the React application, CSS, and optimized assets for Firebase Hosting's CDN.
- **Assistant:** React owns transcript, avatar, speech controls, and a validated navigation dispatcher. Keep the guide as a focused component and defer loading its heavier features until needed.
- **API:** FastAPI on Cloud Run handles validation, App Check, anonymous sessions, quotas, retrieval, provider calls, and feedback.
- **Knowledge artifact:** one versioned content source feeds both rendered pages and backend evidence. Begin with a small deterministic index; introduce embeddings only if evaluations justify them.
- **Firestore:** distributed counters, budget reservations, bounded cache, redacted questions, and optional feedback. It is not the authoring database.
- **Providers:** model and optional speech services behind interfaces. Concrete providers remain undecided.

## Request Boundaries

Browser requests public pages without authentication. Paid API endpoints validate App Check and a server-issued anonymous session, then reserve quota before calling a provider. Use Firestore transactions across instances; never rely only on in-memory counters. Clients receive citations and an allowlisted action proposal, not executable code.

Prefer a same-origin `/api/v1/*` Firebase Hosting rewrite to Cloud Run. Keep requests within the hosting proxy deadline; avoid long live-audio sessions in the initial version. Browser text-to-speech may bypass the backend when selected. [Hosting serverless integration](https://firebase.google.com/docs/hosting/serverless-overview)

## State and Navigation

Use stable project IDs and canonical routes. Keep assistant state in focused React components. Use React Router for case-study routes and rebind section navigation after route changes. Restore only safe short-lived UI state; never persist transcripts without an explicit decision.

## Failure Behavior

Quota-store failure: deny paid requests. Provider failure: return a clear recoverable error and keep publication navigation available. Unsupported speech: offer text. Invalid action or unknown citation: discard it and do not move the page. Global budget exhausted: disable new paid requests until reset or owner intervention.
