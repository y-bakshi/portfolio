# Yash Bakshi Portfolio

A technical portfolio for desktop and mobile, presented as a mid-century engineering journal. The site will showcase AI application engineering, backend systems, and selected software projects through editorial case studies and an interactive portfolio guide.

## Repository Layout

```text
apps/
└── web/    Astro frontend with Vue interactive islands
```

The future FastAPI backend will live in `apps/api/`.

## Technical Documentation

See [docs/README.md](docs/README.md) for requirements, architecture, API and database contracts, interface flows, development, testing, deployment plans, and decisions. The [roadmap](docs/roadmap.md) distinguishes completed scaffolding from planned features.

New contributors should start with the [handoff guide](docs/handoff.md). It includes the visual references, asset specifications, draft content sources, and outstanding owner inputs. The current application is a scaffold; the complete portfolio is still to be implemented.

## Development

```sh
cd apps/web
npm ci
npm run dev
```

Before submitting changes, run:

```sh
npm run check
npm run build
```
