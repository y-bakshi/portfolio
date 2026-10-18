# Testing Strategy

## Current Checks

`npm run check`, `npm run build`, `npm run format:check`, `npm test` and `npm run e2e` run in `apps/web/`. `npm test` runs Vitest with React Testing Library in jsdom (about 560 tests across 54 files); the pages and figures also render with no window, as the build does.

- **`content.test.ts`, `content/diagrams/diagrams.test.ts`:** data integrity (unique ids, complete projects, dated roles, every project has a figure, every belt joins real stations, every route follows belts and every station is used).
- **`diagrams/scene/scene.test.tsx`:** for each of the ten figures: it draws with no window and no broken numbers, describes itself and lists its steps, is painted back to front, has a slot for packets at every station and belt, keeps every packet on a real slot inside the bench for two whole cycles, shows a packet when standing still, and sends one down every route. The page's static HTML holds a placeholder, not the drawing.
- **`Guide/Avatar/avatar.test.ts`:** the face is finite and closed in every mood, a pure function of time, different in each mood, eased without overshoot, and its blink and gaze stay small.
- **`Guide.test.tsx`, `Guide/useGuide.test.tsx`:** the chat panel: closed and inert by default, opens and focuses the input, Escape closes and returns focus, suggested and typed questions are answered, the answer is announced once, earlier exchanges are kept, a cited card is scrolled to, focused and marked, a card on another page navigates there, and the stored chat (restore, clear, errors, thumbs, notice).
- **`pages.test.tsx`:** every page has one h1, the landmarks, a skip link and the guide; the work-in-progress note sits above the header; the home page, the projects page (including the filter tabs), the case study (the results table), the experience page and the contact page have what they should, with safe external links; the 404 page has a way back.
- **`styles.test.ts`, `files.test.ts`:** the palette keeps text pairs above 4.5:1 and the selection colour is legible, `index.html` asks no third party for fonts, no component holds a long array of copy, and no source file passes 220 lines (the vendored kit excepted).
- **`seo/*`, `worker/*`:** the prerendered pages carry their content, the sitemap, llms.txt and structured data cover every page, and the Worker's checks.

`npm run e2e` runs Playwright against the dev server in real Chromium, as a 1280 px desktop and a 375 px phone (about 130 tests):

- **`pages.spec.ts`:** no sideways scrolling at 320, 375, 768, 1024 and 1440 px on every page (TC-15), the header is sticky and marks the current page, the links between pages go where they say, a project link lands on its project, the filter tabs filter, the contact page copies the address, and the technology strip can be paused.
- **`figures.spec.ts`:** a chart's packet moves while it is on screen and holds one frame under reduced motion, it describes itself and lists its steps on the case-study page, pointing at or focusing a step lights its box, every project has a chart, and TestPilot's chart shows its loop back.
- **`panel-wide.spec.ts` (desktop):** the panel is a column on the right and the page behind it still scrolls, the closed panel is out of keyboard reach and Escape closes it, a long answer starts in view, a source button scrolls to and marks its card, and a source on another page opens that page with the chat open.
- **`panel-phone.spec.ts` (phone):** the header folds into a menu, the launcher opens the chat as a page of its own and the back arrow returns, messages sit on the right sides, the suggested questions go once one is tapped, the input is reachable, a source button goes to the card on its page, and a tap on the shrunk launcher while scrolling opens the chat.
- **`chat-persistence.spec.ts`:** the stored chat survives a reload, waits for the portrait on the home page, shows the newest exchange, restores from the server, clears here and on the server, reports an API failure, sends thumbs, and keeps the open panel and the draft.
- **`a11y.spec.ts`:** axe-core finds no serious or critical violations on every page and with the guide open and answering, every figure step can be reached by keyboard, and reduced motion removes smooth scrolling and the strip's movement.

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
