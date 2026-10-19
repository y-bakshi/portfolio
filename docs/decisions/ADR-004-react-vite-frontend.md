# ADR-004: React + Vite Frontend

> Partly superseded: Tailwind CSS came back with shadcn/ui ([ADR-007](ADR-007-tailwind-shadcn-redesign.md)), hosting moved from Firebase to Cloudflare ([ADR-006](ADR-006-cloudflare-hosting.md)), and the FastAPI backend was replaced by an API in the site's Worker ([ADR-008](ADR-008-api-on-the-worker.md)). React, TypeScript, Vite and the multi-page build still stand. The "Update" section below is kept as history.

Status: accepted; scaffold implemented. Date: 2026-10-01.

## Context

The portfolio combines editorial project pages with a substantial interactive AI guide, animated states, and optional voice. The owner selected the same frontend stack as the TestPilot project: React, TypeScript, Vite, and Tailwind CSS. The Astro/Vue scaffold was too focused on static pages and split UI state across frameworks.

## Decision

Use React and TypeScript for the application UI, Vite for local development and production bundling, and Tailwind CSS for utility styling. Keep the visual journal's design tokens and distinctive editorial details in custom CSS. Use focused React components for the guide and other interactive features. Use React Router when case-study routes are introduced.

Build the frontend as static files for Firebase Hosting. Keep paid model and speech-provider calls behind the planned FastAPI backend; frontend variables prefixed with `VITE_` are public.

## Consequences

- The whole page runs as a client-rendered React application; ensure the core portfolio remains useful when the guide is unavailable and manage SEO metadata for each route.
- Vite does not supply server-side rendering or route fallback configuration. Firebase Hosting must serve the application entry for client-side routes.
- React provides one component and state model for the publication and assistant. Keep initial bundle size controlled and load optional voice/AI UI only when needed.
- Tailwind supports fast composition, while custom CSS remains appropriate for the bespoke journal art direction.
- The selected Bloub reference is Vue code and cannot be mounted directly as a React component; port its animation to React or replace it with an approved asset before implementing the guide.

## Alternatives

- **Astro with Vue islands:** better static-first rendering, but introduces a second UI framework for the assistant.
- **Next.js:** adds server and framework features not needed for the planned static frontend and FastAPI backend.
- **Plain React without Tailwind:** viable, but inconsistent with the owner's selected implementation stack.

## Update

Tailwind CSS was dropped. The site's styling is hand-written CSS in `apps/web/src/styles/`, and only Tailwind's base reset was ever used, so that reset now lives in `reset.css` and the dependency and config are removed. The decision above stands for React, TypeScript, Vite and React Router.

React Router was also dropped. The site has a home page and case study pages, so each case study is now its own static HTML page built by Vite's multi-page mode. That gives every page its own title and social preview tags (link crawlers do not run JavaScript), removes the need for a host rewrite rule, and saves about 30 KB of gzipped JavaScript.
