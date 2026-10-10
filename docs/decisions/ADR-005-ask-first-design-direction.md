# ADR-005: Ask-first design direction

Status: accepted. Date: 2026-10-09.

## Context

The first implementation followed the documented mid-century journal concept: cream paper, a high-contrast display serif, a brick-red accent, hairline rules and an eyebrow label above every heading. Review judged it to read as generated and generic. The owner asked for a new direction and for the portfolio guide to shape the page.

## Decision

Retire the journal concept. Build the page as a working surface around the guide: an input and suggested questions open the page, answers cite project rows, and the cited row is highlighted. Use a pale grey-green ground, deep green-black ink, cobalt for actions and amber only for the citation highlight. Use Bricolage Grotesque for headlines, Source Serif 4 for reading and JetBrains Mono only inside pipeline traces. Present each project and role as a card in the guide console's style, with a waterfall trace of each pipeline in place of illustrated exhibits. Replace the lab-report skills table with a plain grouped list.

Full tokens and component rules are in [design-language.md](../design/design-language.md).

## Consequences

- The earlier reference screenshots and the Bloub avatar are no longer part of the visual direction. The guide is presented with a status light and text instead of an avatar. Revisit an avatar only if the owner wants one.
- The guide currently answers from a small keyword-matched set in `apps/web/src/content.ts`, grounded in the content snapshot. It is a stand-in for the planned grounded backend, and it says so on the page.
- Fonts load from Google Fonts. Self-host before launch and record licenses.
- Icons come from Flaticon UIcons (npm package). The free license requires crediting Flaticon, done in the footer.

## Alternatives

- **Keep the journal concept with fewer tells:** rejected by the owner.
- **One continuous scroll-driven world, or layered video hero:** needs generated or filmed assets that do not exist yet. Possible later.
