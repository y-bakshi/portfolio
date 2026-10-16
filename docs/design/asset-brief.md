# UI Asset Brief

Version-controlled asset specification. Use it with the [design language](design-language.md).

## Art direction

Flat, graphic and restrained: ivory ground, deep navy ink, navy for actions, and gold used sparingly. Hard edges, no gradients, no soft shadows, no 3D, no neon AI imagery. Anything illustrated should look like it belongs next to a pipeline trace.

## Delivered assets (in `apps/web/public/`)

| Asset | File | Notes |
| --- | --- | --- |
| Favicon | `favicon.svg` | Hand-drawn SVG monogram: bold condensed YB with a gold highlighter bar. Based on an owner-generated Nano Banana concept, redrawn as vector so it stays sharp at 16 px. The old scaffold `favicon.ico` has been removed. |
| Portrait | `portrait.webp` | Halftone engraving derived from the owner's photograph (generated with Nano Banana, owner-approved). The outside ground is transparent and the left, right and bottom edges are feathered so the cropped engraving dissolves into the page instead of ending in a hard line. Source photo is kept outside the repository. |
| Social preview | `og.png` | 1200×630, built from the site itself: ivory ground with the dot grid, the navy portrait, the name in condensed Bahnschrift over a gold bar, and the site description in Geist. `og:image` is relative until a domain exists. |

Record provenance for each generated file: tool (Nano Banana via Gemini CLI), prompt, edits, approval. Prompts used are in this document's history and the session notes; add them here if they should be kept.

## Still needed

| Asset | Status |
| --- | --- |
| Real project screenshots | Capture from verified builds, secrets removed, consistent dimensions, meaningful alt text. |
| Case-study diagrams | Done: an animated flow chart per project from `src/content/diagrams`, drawn by `src/diagrams/flow`. Its steps repeat what the project row says; verify each against its repository before launch. The charts are explanations, not architecture diagrams. |
| Icon set | Done: Hugeicons (free set) through `@hugeicons/react`, with Morphicons for icon toggles, and technology logos from theSVG copied to `public/logos/tech` by `npm run logos:copy`. The footer credits them (the Rust logo is CC BY-SA 4.0). Record this if the icon set changes. |
| Fonts | Self-hosted variable WOFF2 through Fontsource (`@fontsource-variable/instrument-sans`, `geist`, `geist-mono`), all SIL OFL 1.1. Only the Latin subsets load for English text. |
| Résumé | Secondary action. Owner to supply. |
| Contact links | Done: two email addresses, LinkedIn, GitHub and the 30 minute booking link. |

## Delivery rules

Descriptive file names. Declare image dimensions. Alt text for evidence images, empty alt for decoration. Keep pipeline diagrams as live markup so text stays selectable. Keep unfinished source material out of the shipped bundle.
