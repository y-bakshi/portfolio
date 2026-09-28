# Testing Strategy

## Current Checks

The scaffold provides `npm run check` and `npm run build` in `apps/web/`. No unit, integration, browser, accessibility, or load-test runner is installed yet. The tools below are planned; add their configuration and commands with the corresponding implementation.

## Planned Layers

| Layer | Proposed tooling | Focus |
| --- | --- | --- |
| Content validation | Astro schemas and build | Required fields, known project IDs, real routes, evidence metadata. |
| Frontend units | Vitest / Vue Test Utils | Assistant state transitions, filters, action allowlist, cancellation. |
| Backend units | pytest | Quota windows, cost accounting, redaction, citation validation, provider adapters. |
| Integration | pytest + Firestore emulator | Concurrent reservations, idempotency, settlement, cleanup, fail-closed behavior. |
| Browser | Playwright | Publication navigation, assistant flows, contact, keyboard, responsive layouts. |
| Accessibility | axe-core plus manual review | Automated violations, focus, announcements, reading order, voice alternatives. |
| Performance | Lighthouse and k6 | Publication budgets, cold/warm API latency, quotas under contention. |

## Grounding Evaluation

Maintain a versioned question set containing recruiter questions, architecture questions, unsupported personal claims, unrelated requests, and prompt-injection attempts. Score citation correctness, contribution attribution, refusal/uncertainty, answer relevance, and valid navigation actions. Run deterministic adapter tests in CI; run a capped live-provider evaluation before changes to models, prompts, or retrieval.

## Release Gate

Type checking and build must pass. Critical tests in [test cases](test-cases.md) must pass on desktop and mobile. Validate accessibility, licenses, production contact links, privacy notice, spend guards, and failure behavior. No numerical coverage threshold is set yet; prioritize meaningful coverage of navigation, costs, security boundaries, and evidence integrity.

Mock providers by default. Avoid unbounded paid calls in CI. Real-device checks on iOS Safari and Android Chrome supplement browser emulation; emulation alone does not validate microphones, keyboards, or speech APIs.
