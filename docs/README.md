# Technical Documentation

This documentation describes Yash Bakshi's responsive editorial portfolio for desktop and mobile. The application positions AI application engineering first, supported by backend engineering and production delivery.

## Current State

The implemented application is an Astro static scaffold with TypeScript and the official Vue integration in `apps/web/`. It has a placeholder homepage and working `check` and `build` scripts. The backend, assistant, database, automated tests, infrastructure, and deployment workflows are not implemented yet.

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
| Operations | [Deployment](deployment/deployment.md), [infrastructure](deployment/infrastructure.md) |
| Technical decisions | [Frontend](decisions/ADR-001-frontend-framework.md), [database](decisions/ADR-002-database-choice.md), [authentication](decisions/ADR-003-authentication.md) |
| Delivery order | [Roadmap](roadmap.md) |

Keep requirements, diagrams, API contracts, and tests synchronized as implementation progresses. Agent instructions and private working briefs remain excluded from version control; this folder contains the shareable technical specification.
