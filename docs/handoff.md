# Contributor Handoff

## Start Here

1. Read the [documentation index](README.md), [functional requirements](requirements/functional-requirements.md), and [quality targets](requirements/non-functional-requirements.md).
2. Review [design language](design/design-language.md), [asset brief](design/asset-brief.md), [reference gallery](design/references/README.md), and [wireframes](design/wireframes/README.md).
3. Use the [content snapshot](content/portfolio-content.md) and [source inventory](content/source-inventory.md) for initial copy and follow-up evidence requests.
4. Run the [local setup](development/setup.md) and start with Phase 1 of the [roadmap](roadmap.md).

## What Is Ready

The repo includes a React/TypeScript/Vite scaffold, lockfile, check/build commands, product requirements, architecture/contracts, visual specifications, reference screenshots, content summary, operational plans, and ADRs. Agent files/private root briefs are ignored and are not needed to interpret the shared specification.

The site has a home page, a projects page, a TestPilot case-study page, an experience page and a contact page, rebuilt with Tailwind and shadcn in October 2026 (see [ADR-007](decisions/ADR-007-tailwind-shadcn-redesign.md), which supersedes the styling of [ADR-005](decisions/ADR-005-ask-first-design-direction.md)), with an animated isometric figure per project; its guide answers through the Worker API (`apps/web/worker/`), with retrieval over the project notes and Gemini. No published case studies beyond the TestPilot template, real assistant, API, database, cloud infrastructure, deployment automation, or automated test suite exists. Documentation diagrams show intended architecture rather than provisioned services.

## Agreed Direction

- Recruiters/hiring managers and developer collaborators are the audiences.
- AI application engineering leads; backend engineering supplies depth.
- The guide is a side panel on every page: answers cite project and role cards, and the cited card is highlighted. The home page leads with who Yash is, not the chat.
- Ivory, navy and gold visual system (supersedes the mid-century journal concept); desktop and mobile have equal functionality.
- Full project catalog with stronger AI/SDE emphasis, pipeline traces per project, case studies.
- Contact options: email, LinkedIn, GitHub, and scheduling (30 minute Google Calendar booking link is set); résumé secondary.
- Text guide (voice later) with an animated face and a status line, explaining verified work and offering controlled navigation.
- Planned GCP deployment: Firebase Hosting, Cloud Run/FastAPI, Firestore operational state; combined $25 monthly target with measured quotas.
- Phased development; public website launch waits for integrated quality checks. Source code is public already.

## Open Decisions and Owner Inputs

Domain (needed for an absolute `og:image`), résumé PDF, verified project URLs/metrics, featured order, final model/voice providers, and quotas. These are explicit outstanding inputs, not assumptions for a contributor to invent. Static layout/content schema work can proceed while they are resolved.

## Completion Criteria

Follow the [test cases](testing/test-cases.md) and [release plan](deployment/deployment.md). The implemented portfolio must have verified content, usable contact paths, desktop/mobile and accessibility checks, grounded assistant behavior, quota/failure verification, deployment/rollback instructions, and operational cost controls before launch.

Update docs and ADRs when implementation changes the contracts. Keep secrets, private CV material, and agent context out of commits. This handoff is ready for implementation; it is not a finished website or a deployment authorization.
