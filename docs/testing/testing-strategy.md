# Testing Strategy

## Current Checks

`npm run check`, `npm run build`, `npm run format:check`, `npm test` and `npm run e2e` run in `apps/web/`. `npm test` runs Vitest with React Testing Library in jsdom: 60 tests across four files.

- **`content.test.ts`:** data integrity (unique ids, complete projects, valid trace indentation, dated roles) and the guide's answers: each topic cites the right sources, every cited id exists on the page, an unknown question gets an honest miss, and short keywords do not match inside other words.
- **`Guide.test.tsx`:** the chat in the page: closed and inert by default, opens and focuses the input, Escape closes and returns focus, suggested and typed questions are answered, the answer is announced once, earlier exchanges are kept, empty submits are ignored, a cited card is scrolled to, focused and highlighted, and the thinking, answering and ready states run in order.
- **`pages.test.tsx`:** the home page and the case study: one h1, landmarks, skip link, every section and card, real contact links, the portrait's description, and no guide on the case study.
- **`styles/styles.test.ts`:** every stylesheet is imported in a fixed order and stays under 600 lines, no CSS targets a class no component uses, every class a component names has a rule, text colour pairs keep at least 4.5:1 contrast, and `index.html` asks no third party for fonts.

`npm run e2e` runs Playwright against the dev server in real Chromium, as a 1280 px desktop and a 375 px phone (50 tests in four files):

- **`layout.spec.ts`:** no sideways scrolling at 320, 375, 768, 1024 and 1440 px on the home page and the case study (TC-15), the header stays one row and sticky, a case study link opens the new page at the top, and a section link lands on its section.
- **`desktop.spec.ts`:** the hero fills the first screen, the portrait clears the header, the bar widens to the full window and closes with focus returned to it, answers appear beside the portrait and earlier ones are kept, the page does not move while an answer streams, scrolling with the pointer over the conversation scrolls the page, a navigation button jumps to and highlights its card, asking while scrolled down brings the page back, and the keyboard focus ring shows on the input.
- **`phone.spec.ts`:** the open chat fills the screen and locks the page behind it, your messages sit right and the newest answer is fully visible, the suggestion row scrolls sideways with no scrollbar, a navigation button closes the chat and shows the card, and the header fits one row.
- **`a11y.spec.ts`:** axe-core finds no serious or critical violations on the home page (closed and with an answer showing) or the case study, and reduced motion removes the transitions and smooth scrolling.

First run on a machine: `npx playwright install chromium`. Playwright starts its own dev server on port 5199 (or reuses one that is already running).

Not covered by automated tests yet: the canvas effects, hover appearance, the phone's on-screen keyboard and browser toolbars (emulation does not reproduce them), screen-reader output, and real Safari and Firefox. Check those on real devices before launch.

## Planned Layers

| Layer | Proposed tooling | Focus |
| --- | --- | --- |
| Content validation | TypeScript types and build | Required fields, known project IDs, real routes, evidence metadata. |
| Frontend units (in place) | Vitest / React Testing Library | Assistant state transitions, filters, action allowlist, cancellation. |
| Backend units | pytest | Quota windows, cost accounting, redaction, citation validation, provider adapters. |
| Integration | pytest + Firestore emulator | Concurrent reservations, idempotency, settlement, cleanup, fail-closed behavior. |
| Browser (in place) | Playwright | Publication navigation, assistant flows, contact, keyboard, responsive layouts. |
| Accessibility (axe in place) | axe-core plus manual review | Automated violations, focus, announcements, reading order, voice alternatives. |
| Performance | Lighthouse and k6 | Publication budgets, cold/warm API latency, quotas under contention. |

## Grounding Evaluation

Maintain a versioned question set containing recruiter questions, architecture questions, unsupported personal claims, unrelated requests, and prompt-injection attempts. Score citation correctness, contribution attribution, refusal/uncertainty, answer relevance, and valid navigation actions. Run deterministic adapter tests in CI; run a capped live-provider evaluation before changes to models, prompts, or retrieval.

## Release Gate

Type checking and build must pass. Critical tests in [test cases](test-cases.md) must pass on desktop and mobile. Validate accessibility, licenses, production contact links, privacy notice, spend guards, and failure behavior. No numerical coverage threshold is set yet; prioritize meaningful coverage of navigation, costs, security boundaries, and evidence integrity.

Mock providers by default. Avoid unbounded paid calls in CI. Real-device checks on iOS Safari and Android Chrome supplement browser emulation; emulation alone does not validate microphones, keyboards, or speech APIs.
