# Yash Bakshi Portfolio

A technical portfolio for desktop and mobile, built around an interactive portfolio guide. The site showcases AI application engineering, backend systems, and selected software projects through project rows with pipeline traces and case studies.

## Repository Layout

```text
apps/
└── web/    React + Vite frontend with hand-written CSS
```

The future FastAPI backend will live in `apps/api/`.

## Technical Documentation

See [docs/README.md](docs/README.md) for requirements, architecture, API and database contracts, interface flows, development, testing, deployment plans, and decisions. The [roadmap](docs/roadmap.md) distinguishes completed scaffolding from planned features.

New contributors should start with the [handoff guide](docs/handoff.md). It includes the visual references, asset specifications, draft content sources, and outstanding owner inputs. The site's five pages and the TestPilot case study are built, and the guide answers through the Worker API (retrieval over the project notes and Gemini) on the owner's machine; nothing is deployed yet. See the [roadmap](docs/roadmap.md) for what remains.

## Development

```sh
cd apps/web
npm ci
npm run dev
```

Before submitting changes, run:

```sh
npm run format:check
npm run check
npm test
npm run build
npm run e2e
```
