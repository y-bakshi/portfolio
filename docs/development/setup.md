# Development Setup

## Current Frontend

Requirements: Node.js ≥22.12.0 and npm. The committed lockfile records exact dependencies.

```sh
git clone https://github.com/y-bakshi/portfolio.git
cd portfolio/apps/web
npm ci
npm run dev
```

Open the URL reported by Astro, normally `http://localhost:4321`. Commands run from `apps/web/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server. |
| `npm run check` | Astro and TypeScript diagnostics. |
| `npm run build` | Static production output in `dist/`. |
| `npm run preview` | Inspect the production output locally. |

For constrained environments, prefix Astro commands with `ASTRO_TELEMETRY_DISABLED=1` if telemetry configuration cannot be written. Never commit `node_modules/`, `.astro/`, or `dist/`.

## Planned Backend

`apps/api/` does not exist yet. Its Python version, dependency manager, lockfile, startup command, and test command must be chosen and documented when it is added. Do not assume a requirements file, container, or database emulator already exists.

Start backend work against mock provider adapters and a local quota store/emulator. Add cloud credentials only for explicit integration testing. Avoid production Firestore during local development.

## Content and Documentation

Case studies will use validated content collections; changes should update the public page and backend evidence artifact together. Read [coding standards](coding-standards.md), [environment variables](environment-variables.md), and [roadmap](../roadmap.md) before introducing new services.
