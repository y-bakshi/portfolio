# ADR-005: Ask-first design direction

Status: accepted. Date: 2026-10-09.

## Context

The first implementation followed the documented mid-century journal concept: cream paper, a high-contrast display serif, a brick-red accent, hairline rules and an eyebrow label above every heading. Review judged it to read as generated and generic. The owner asked for a new direction and for the portfolio guide to shape the page.

## Decision

Retire the journal concept. Build the page as a working surface around the guide: a chat bar with an input and suggested questions, answers shown beside the portrait on desktop and in a full-screen chat on phones, answers cite project rows, and the cited row is highlighted. Use an ivory ground, deep navy ink, a slightly lighter navy for actions and gold only for the citation highlight. Use Instrument Sans (condensed) for headlines, Geist for reading, chat and card text, and Geist Mono only inside pipeline traces. Present each project and role as a card in the guide console's style, with a waterfall trace of each pipeline in place of illustrated exhibits. Replace the lab-report skills table with a plain grouped list.

Add two canvas effects, both decoration only and static under reduced motion: a page-wide grid of ink dots that the pointer pushes aside, and a portrait that condenses from suspended ink particles. They share one push radius (`pointerPush.ts`). Because dots would make text hard to read, any text that sits on the grid goes on an opaque card; a text halo was tried and rejected.

Full tokens and component rules are in [design-language.md](../design/design-language.md).

## Consequences

- The earlier reference screenshots and the Bloub avatar are no longer part of the visual direction. The guide is presented with a status light and text instead of an avatar. Revisit an avatar only if the owner wants one.
- The guide currently answers from a small keyword-matched set in `apps/web/src/content.ts`, grounded in the content snapshot. It is a stand-in for the planned grounded backend, and it says so on the page.
- The portrait effect samples the image on load, so it is chunked, uses fewer particles on phones, and drops to half density if frames run slow. It has been measured only in a desktop browser; test on real phones.
- Fonts are self-hosted with Fontsource: Instrument Sans, Geist and Geist Mono, all SIL Open Font License 1.1. No request goes to a font CDN.
- Icons come from Flaticon UIcons (npm package). The free license requires crediting Flaticon, done in the footer.

## Alternatives

- **Keep the journal concept with fewer tells:** rejected by the owner.
- **One continuous scroll-driven world, or layered video hero:** needs generated or filmed assets that do not exist yet. Possible later.
