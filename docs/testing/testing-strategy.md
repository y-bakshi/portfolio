# Testing Strategy

## Current Checks

`npm run check`, `npm run build`, `npm run format:check` and `npm test` run in `apps/web/`. `npm test` runs Vitest with React Testing Library in jsdom: 60 tests across four files.

- **`content.test.ts`:** data integrity (unique ids, complete projects, valid trace indentation, dated roles) and the guide's answers: each topic cites the right sources, every cited id exists on the page, an unknown question gets an honest miss, and short keywords do not match inside other words.
- **`Guide.test.tsx`:** the chat in the page: closed and inert by default, opens and focuses the input, Escape closes and returns focus, suggested and typed questions are answered, the answer is announced once, earlier exchanges are kept, empty submits are ignored, a cited card is scrolled to, focused and highlighted, and the thinking, answering and ready states run in order.
- **`pages.test.tsx`:** the home page and the case study: one h1, landmarks, skip link, every section and card, real contact links, the portrait's description, and no guide on the case study.
- **`styles/styles.test.ts`:** every stylesheet is imported in a fixed order and stays under 600 lines, no CSS targets a class no component uses, every class a component names has a rule, text colour pairs keep at least 4.5:1 contrast, and `index.html` asks no third party for fonts.

Not covered by automated tests yet: real layout and scrolling (jsdom does not lay anything out), the canvas effects, hover and focus appearance, the phone keyboard behaviour, and screen-reader output. The browser, accessibility and performance layers below are still planned. A computed-style snapshot of five page states was used by hand during the stylesheet cleanup and split; turning it into a Playwright check is the natural next step.

## Planned Layers

| Layer | Proposed tooling | Focus |
| --- | --- | --- |
| Content validation | TypeScript types and build | Required fields, known project IDs, real routes, evidence metadata. |
| Frontend units (in place) | Vitest / React Testing Library | Assistant state transitions, filters, action allowlist, cancellation. |
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
