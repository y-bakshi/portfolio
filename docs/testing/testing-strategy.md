# Testing Strategy

## Current Checks

`npm run check`, `npm run build`, `npm run format:check`, `npm test` and `npm run e2e` run in `apps/web/`. `npm test` runs Vitest with React Testing Library in jsdom and, for the Worker, in Node (about 630 tests across 62 files); the pages and figures also render with no window, as the build does.

- **`content.test.ts`, `content/diagrams/diagrams.test.ts`:** data integrity (unique ids, complete projects, dated roles, every project has a figure, every belt joins real stations, every route follows belts and every station is used).
- **`diagrams/scene/scene.test.tsx`:** for each of the ten figures: it draws with no window and no broken numbers, describes itself and lists its steps, is painted back to front, has a slot for packets at every station and belt, keeps every packet on a real slot inside the bench for two whole cycles, shows a packet when standing still, and sends one down every route. The page's static HTML holds a placeholder, not the drawing.
- **`Guide/Avatar/avatar.test.ts`:** the face is finite and closed in every mood, a pure function of time, different in each mood, eased without overshoot, and its blink and gaze stay small.
- **`Guide.test.tsx`, `Guide/useGuide.test.tsx`:** the chat panel: closed and inert by default, opens and focuses the input, Escape closes and returns focus, suggested and typed questions are answered, the answer is announced once, earlier exchanges are kept, a cited card is scrolled to, focused and marked, a card on another page navigates there, and the stored chat (restore, clear, errors, thumbs, notice).
- **`pages.test.tsx`:** every page has one h1, the landmarks, a skip link and the guide; the work-in-progress note is off; the home page (including every role and degree with an id the guide can cite), the projects page (including the filter tabs), the case study (the results table), the contact page and the privacy page have what they should, with safe external links; the 404 page has a way back.
- **`styles.test.ts`, `files.test.ts`:** the palette keeps text pairs above 4.5:1 and the selection colour is legible, `index.html` asks no third party for fonts, no component holds a long array of copy, and no source file passes 220 lines (the vendored kit excepted).
- **`seo/*`:** the prerendered pages carry their content, and the sitemap, llms.txt and structured data cover every page.
- **`worker/*`:** the routes, the limits, the spending cap, the answer cache, retrieval and citations, the owner routes (with a fake Cloudflare for the traffic query), saved evaluations, the headers file and the redirects, on an in-memory SQLite.
- **`worker/rag/eval.test.ts`:** runs the 64 labelled questions with a mock model and fails when a score drops below its threshold ([retrieval](../architecture/rag.md)).
- **`sections/experience/ResumeButton.test.tsx`:** the résumé button's Downloading, Downloaded and not-available states.

`npm run e2e` runs Playwright against the dev server in real Chromium, as a 1280 px desktop and a 375 px phone (about 120 tests, a few skipped for features that are off):

- **`pages.spec.ts`:** no sideways scrolling at 320, 375, 768, 1024 and 1440 px on every page (TC-15), the header is sticky and marks the current page, the links between pages go where they say, a project link lands on its project, the filter tabs filter, the contact page copies the address, and the technology strip can be paused.
- **`figures.spec.ts`:** a chart's packet moves while it is on screen and holds one frame under reduced motion, it describes itself and lists its steps on the case-study page, pointing at or focusing a step lights its box, every project has a chart, and TestPilot's chart shows its loop back.
- **`panel-wide.spec.ts` (desktop):** the panel is a column on the right and the page behind it still scrolls, the closed panel is out of keyboard reach and Escape closes it, a long answer starts in view, a source button scrolls to and marks its card, and a source on another page opens that page with the chat open.
- **`panel-phone.spec.ts` (phone):** the header folds into a menu, the launcher opens the chat as a page of its own and the back arrow returns, messages sit on the right sides, the suggested questions go once one is tapped, the input is reachable, a source button goes to the card on its page, and a tap on the shrunk launcher while scrolling opens the chat.
- **`chat-persistence.spec.ts`:** the stored chat survives a reload, waits for the portrait on the home page, shows the newest exchange, restores from the server, clears here and on the server, reports an API failure, sends thumbs, and keeps the open panel and the draft.
- **`a11y.spec.ts`:** axe-core finds no serious or critical violations on every page and with the guide open and answering, every figure step can be reached by keyboard, and reduced motion removes smooth scrolling and the strip's movement.

First run on a machine: `npx playwright install chromium`. Playwright starts its own dev server on port 5199 (or reuses one that is already running). CI runs the unit tests and the browser tests as two jobs ([CI](../deployment/ci-cd.md)). Two tests that start a build or a browser sometimes time out when the whole suite runs on a busy machine and pass when run alone; rerun the file before assuming a break.

Not covered by automated tests yet: the canvas effects, hover appearance, the phone's on-screen keyboard and browser toolbars (emulation does not reproduce them), screen-reader output, and real Safari and Firefox. Check those on real devices before launch.

## Layers

| Layer | Tooling | Focus |
| --- | --- | --- |
| Content validation | TypeScript types, `content.test.ts` | Required fields, known ids, real routes. In place. |
| Frontend and Worker units | Vitest, React Testing Library, in-memory SQLite | Chat state, filters, limits, budget, redaction, citations, owner routes. In place. |
| Browser | Playwright | Navigation, chat flows, contact, keyboard, responsive layouts, phone chat page. In place. |
| Accessibility | axe-core in Playwright, plus manual review | Automated violations on every page and with the guide open. In place; screen-reader review is manual. |
| Retrieval and answer quality | `eval.test.ts` (mock, in CI), `npm run eval:record` (live, by hand) | 64 labelled questions: recall, precision, faithfulness, correctness, relevancy, citations, refusals, cost. In place. |
| Performance | Lighthouse and k6 | Not run yet; see [performance testing](performance-testing.md). |

## Grounding evaluation

`eval/questions.jsonl` holds recruiter and architecture questions the notes answer, unsupported questions about Yash, partly answerable ones, unrelated requests and prompt-injection attempts. The mock run is a regression check in CI. A live run (`npm run eval:record -- --live`, about 240 paid calls, a few cents) says how good the guide is; it is saved to the database and shown on the owner page, marked out of date when the notes or the prompt change. Do one before and after a change to the model, the prompt or the retrieval. The word-overlap relevancy score varies by a few points between runs; read the listed failures.

## Release Gate

Type checking and build must pass. Critical tests in [test cases](test-cases.md) must pass on desktop and mobile. Validate accessibility, licenses, production contact links, privacy notice, spend guards, and failure behavior. No numerical coverage threshold is set; prioritize meaningful coverage of navigation, costs, security boundaries and evidence integrity.

Mock providers by default. Never make paid calls in CI. Real-device checks on iOS Safari and Android Chrome supplement browser emulation; emulation does not reproduce the phone's on-screen keyboard or browser toolbars.
