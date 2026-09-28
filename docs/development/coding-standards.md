# Coding Standards

## TypeScript, Astro, and Vue

- Use two spaces, strict types, and descriptive names; avoid untyped provider payloads.
- Use `PascalCase` for UI components, `camelCase` for functions/variables, and `kebab-case` for assets and routes.
- Keep editorial templates in Astro and interactive state in focused Vue components.
- Prefer semantic HTML and native controls; include keyboard behavior with the feature.
- Define CSS tokens for paper, ink, red annotation, spacing, typography, and motion.
- Model assistant status as explicit states; clear timers, audio, subscriptions, and listeners on disposal.
- Render untrusted answers as text or sanitized restricted markup. Never inject model HTML or execute supplied selectors/scripts.

## Planned Python Backend

Use typed request/response models, four-space indentation, explicit timeouts, and narrow exception handling. Separate HTTP handlers, quota transactions, retrieval, and provider adapters. Provider responses require schema validation and bounded inputs/outputs. Never place external calls in transaction callbacks.

## Evidence and Assets

Each personal claim must have a source and accurate ownership boundary. Track measured versus estimated results. Record licenses for fonts, images, icons, and Bloub. Prefer authored SVG for technical diagrams and provide text equivalents.

## Tooling Status

`npm run check` and `npm run build` exist. No formatter, lint script, Python tooling, or test runner is configured. Adopt those deliberately and document commands rather than referring to nonexistent checks.
