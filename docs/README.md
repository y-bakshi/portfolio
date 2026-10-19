# Technical Documentation

This documentation describes Yash Bakshi's responsive portfolio for desktop and mobile. The application positions AI application engineering first, supported by backend engineering and production delivery.

## Current State

The implemented application is a React + TypeScript frontend built with Vite and styled with Tailwind v4 and shadcn/ui in `apps/web/`. It has a home page, projects, case study, experience and contact pages, each project explained by an animated figure, and working `check`, `build`, unit and browser test scripts. The backend, AI guide, database, automated tests, infrastructure, and deployment workflows are not implemented yet.

Unless explicitly labeled implemented, contracts and operational settings in these documents are planned. Proposed values are starting points for verification, not measured results. Public source availability does not mean the website has launched.

## Reading Map

| Area | Start here |
| --- | --- |
| Contributor handoff | [Handoff guide](handoff.md), [content inventory](content/source-inventory.md) |
| Product scope | [Functional requirements](requirements/functional-requirements.md) |
| Quality and constraints | [Non-functional requirements](requirements/non-functional-requirements.md) |
| Visitor goals | [User stories](requirements/user-stories.md) |
| Components and boundaries | [System architecture](architecture/system-architecture.md) |
| Data and service contracts | [Database](architecture/database-design.md), [API](architecture/api-design.md) |
| Interaction and visual layout | [Design language](design/design-language.md), [UI flow](design/ui-flow.md), [wireframes](design/wireframes/README.md) |
| Assets and visual references | [Asset brief](design/asset-brief.md), [reference gallery](design/references/README.md) |
| Local development | [Setup](development/setup.md) |
| Verification | [Testing strategy](testing/testing-strategy.md) |
| Operations | [Deployment](deployment/deployment.md), [infrastructure](deployment/infrastructure.md), [analytics](deployment/analytics.md) |
| Technical decisions | Current: [React and Vite](decisions/ADR-004-react-vite-frontend.md) (partly superseded), [Cloudflare hosting](decisions/ADR-006-cloudflare-hosting.md), [Tailwind and shadcn redesign](decisions/ADR-007-tailwind-shadcn-redesign.md), [API on the Worker](decisions/ADR-008-api-on-the-worker.md), [data and abuse protection](decisions/ADR-009-data-and-abuse-protection.md), [retrieval and evaluation](decisions/ADR-010-retrieval-and-evaluation.md). Superseded: [Astro frontend](decisions/ADR-001-frontend-framework.md), [Firestore](decisions/ADR-002-database-choice.md), [App Check](decisions/ADR-003-authentication.md), [ask-first design](decisions/ADR-005-ask-first-design-direction.md) (partly) |
| Delivery order | [Roadmap](roadmap.md) |

Keep requirements, diagrams, API contracts, and tests synchronized as implementation progresses. Agent instructions and private working briefs remain excluded from version control; this folder contains the shareable technical specification.
