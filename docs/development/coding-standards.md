# Coding Standards

## TypeScript, React, and Vite

- Use two spaces, strict types, and descriptive names; avoid untyped provider payloads.
- Use `PascalCase` for UI components, `camelCase` for functions/variables, and `kebab-case` for assets and routes.
- Use React components for page UI and interactive state; keep Vite configuration focused on build and development tooling.
- Prefer semantic HTML and native controls; include keyboard behavior with the feature.
- Define design tokens for ground, panel, ink, action, highlight, spacing, typography and motion in `src/tailwind.css`, and use Tailwind utilities rather than new CSS files.
- Model assistant status as explicit states; clear timers, audio, subscriptions, and listeners on disposal.
- Render untrusted answers as text or sanitized restricted markup. Never inject model HTML or execute supplied selectors/scripts.

## The Worker API

The API is TypeScript in `apps/web/worker/` ([ADR-008](../decisions/ADR-008-api-on-the-worker.md)). Use typed request and response shapes and the typed `Env`. Keep route handlers thin: put limits, budget, retrieval, citations and provider adapters in their own modules so they can be tested without Cloudflare (the `Db` interface and the in-memory SQLite in tests exist for that). Give every outside call a timeout, validate provider responses, bound inputs and outputs, and never put a model call inside a Durable Object operation. Tests that use `node:sqlite` need `// @vitest-environment node` on the first line.

Source files stay small and do one job. `files.test.ts` caps site source at 220 lines; split a file before it grows into more than one job.

## Evidence and Assets

Each personal claim must have a source and accurate ownership boundary. Track measured versus estimated results. Record licenses for fonts, images, icons, and Bloub. Prefer authored SVG for technical diagrams and provide text equivalents.

## Tooling

Prettier is configured in `apps/web/.prettierrc.json`; run `npm run format` or `npm run format:check` from `apps/web/`. `npm run check` is the TypeScript check, `npm run build` runs it and builds, `npm test` runs Vitest and `npm run e2e` runs Playwright. There is no lint script. Run all four checks before a commit that is not a copy-only change.
