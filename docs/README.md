# Technical Documentation

This documentation describes Yash Bakshi's responsive portfolio for desktop and mobile. The application positions AI application engineering first, supported by backend engineering and production delivery.

## Current State

The site is live at `yashbakshi.com`. It is a React and TypeScript front end built with Vite and styled with Tailwind v4 and shadcn/ui in `apps/web/`, served by a Cloudflare Worker that also runs the API behind the guide (retrieval over approved notes and Gemini, an anonymous stored chat, protection and a spending cap) and an owner page behind Cloudflare Access. Pages: home (with the experience), projects, a case study, contact, privacy and credits, a phone chat page and a 404. CI runs formatting, type checks, the build, unit tests and browser tests; a merge to `main` deploys.

The design and planning documents record what was decided and built. Where a page is still a plan (voice, for example) it says so. Numbers marked as targets are targets, not measurements. [Roadmap](roadmap.md) lists what is left.

## Reading Map

| Area | Start here |
| --- | --- |
| Contributor handoff | [Handoff guide](handoff.md), [content inventory](content/source-inventory.md) |
| Product scope | [Functional requirements](requirements/functional-requirements.md) |
| Quality and constraints | [Non-functional requirements](requirements/non-functional-requirements.md) |
| Visitor goals | [User stories](requirements/user-stories.md) |
| Components and boundaries | [System architecture](architecture/system-architecture.md) |
| Data and service contracts | [Database](architecture/database-design.md), [API](architecture/api-design.md), [retrieval and evaluation](architecture/rag.md) |
| Interaction and visual layout | [Design language](design/design-language.md), [UI flow](design/ui-flow.md), [wireframes](design/wireframes/README.md) |
| Assets and visual references | [Asset brief](design/asset-brief.md), [reference gallery](design/references/README.md) |
| Local development | [Setup](development/setup.md), [environment variables](development/environment-variables.md) |
| Verification | [Testing strategy](testing/testing-strategy.md) |
| Operations | [Deployment](deployment/deployment.md), [infrastructure](deployment/infrastructure.md), [CI](deployment/ci-cd.md), [protection](deployment/protection.md), [analytics and the owner page](deployment/analytics.md), [search visibility](deployment/seo.md) |
| Technical decisions | Current: [React and Vite](decisions/ADR-004-react-vite-frontend.md) (partly superseded), [Cloudflare hosting](decisions/ADR-006-cloudflare-hosting.md), [Tailwind and shadcn redesign](decisions/ADR-007-tailwind-shadcn-redesign.md), [API on the Worker](decisions/ADR-008-api-on-the-worker.md), [data and abuse protection](decisions/ADR-009-data-and-abuse-protection.md), [retrieval and evaluation](decisions/ADR-010-retrieval-and-evaluation.md). Superseded: [Astro frontend](decisions/ADR-001-frontend-framework.md), [Firestore](decisions/ADR-002-database-choice.md), [App Check](decisions/ADR-003-authentication.md), [ask-first design](decisions/ADR-005-ask-first-design-direction.md) (partly) |
| Delivery order | [Roadmap](roadmap.md) |

Keep requirements, diagrams, API contracts, and tests synchronized as implementation progresses. Agent instructions and private working briefs remain excluded from version control; this folder contains the shareable technical specification.
