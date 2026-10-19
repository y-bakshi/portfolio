# Contributor Handoff

## Start Here

1. Read the [documentation index](README.md), then [system architecture](architecture/system-architecture.md) and the [decision records](decisions/) (ADR-006 to ADR-010 describe what is built).
2. Run the [local setup](development/setup.md). Everything is in `apps/web/`.
3. Review [design language](design/design-language.md) and [asset brief](design/asset-brief.md) before changing the look.
4. Use the [content snapshot](content/portfolio-content.md) and [source inventory](content/source-inventory.md) for copy and for evidence requests.
5. See the [roadmap](roadmap.md) for what is left.

## What exists

The site is live at `yashbakshi.com`: a home page (the introduction, then the engineering experience and the degrees), a projects page where each project is explained by an animated flow chart, a TestPilot case study, a contact page, a privacy and credits page, and a chat page for phones. The old `/experience/` address redirects to the home page. It is built with React, Vite, Tailwind v4 and shadcn/ui ([ADR-007](decisions/ADR-007-tailwind-shadcn-redesign.md)) and prerendered to static HTML.

The guide is a side panel on wide screens and a page of its own on phones. It answers through the Worker API (`apps/web/worker/`): retrieval over approved notes, Gemini for the answer, citations that highlight a card on the page, an anonymous stored chat, protection and a spending cap ([ADR-008](decisions/ADR-008-api-on-the-worker.md), [ADR-009](decisions/ADR-009-data-and-abuse-protection.md), [ADR-010](decisions/ADR-010-retrieval-and-evaluation.md)). An owner page at `/admin`, behind Cloudflare Access, shows page analytics, usage, weak questions, saved evaluations of the guide and cost.

It deploys to Cloudflare from `main` ([deployment](deployment/deployment.md)). CI runs formatting, type checks, the build, about 630 unit tests and about 120 browser tests ([testing strategy](testing/testing-strategy.md)).

## Agreed direction

- Recruiters, hiring managers and developer collaborators are the audiences.
- AI application engineering leads; backend engineering supplies depth.
- The home page leads with who Yash is. The guide is available on every page; answers cite cards and the cited card is highlighted.
- Ivory, navy and gold visual system; desktop and mobile have equal functionality.
- Contact: email, LinkedIn, GitHub and a 30 minute booking link; the résumé is a download button.
- Notes about past employers stay at the level of the résumé. Do not add internal details of an employer's systems.
- Secrets, private CV material and agent context stay out of commits. The résumé PDF is in R2, not in the repository.

## Open items and owner inputs

See the [roadmap](roadmap.md): an up-to-date résumé upload, the guide's missing answers (target role, relocation, certifications, why hire), a photography page (later), a budget alert on the Gemini key, and a decision about branch previews behind Access.

## Completion criteria for a change

Follow the [test cases](testing/test-cases.md). Run `npm run format:check`, `npm run build`, `npm test` and `npm run e2e` before a commit. Rebuild the notes index when a note changes. Update the docs and the decision records when a contract changes.
