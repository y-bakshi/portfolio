# UI Asset Brief

Version-controlled asset specification. Use it with the [design language](design-language.md).

## Art direction

Flat, graphic and restrained: pale grey-green ground, deep green-black ink, cobalt, and amber used sparingly. Hard edges, no gradients, no soft shadows, no 3D, no neon AI imagery. Anything illustrated should look like it belongs next to a pipeline trace.

## Delivered assets (in `apps/web/public/`)

| Asset | File | Notes |
| --- | --- | --- |
| Favicon | `favicon.svg` | Hand-drawn SVG monogram: bold condensed YB with an amber highlighter bar. Based on an owner-generated Nano Banana concept, redrawn as vector so it stays sharp at 16 px. The old scaffold `favicon.ico` has been removed. |
| Portrait | `portrait.webp` | Halftone engraving derived from the owner's photograph (generated with Nano Banana, owner-approved). Ground made transparent so it sits on the page colour. Source photo is kept outside the repository. |
| Social preview | `og.png` | 1200×630. Staircase artwork generated with Nano Banana, with name and thesis added as real text (Bahnschrift). `og:image` is relative until a domain exists. |

Record provenance for each generated file: tool (Nano Banana via Gemini CLI), prompt, edits, approval. Prompts used are in this document's history and the session notes; add them here if they should be kept.

## Still needed

| Asset | Status |
| --- | --- |
| Real project screenshots | Capture from verified builds, secrets removed, consistent dimensions, meaningful alt text. |
| Case-study diagrams | Verify against each repository before replacing the editorial traces. Generated art must not stand in for architecture. |
| Icon set | Done: Flaticon UIcons (`@flaticon/flaticon-uicons`, solid rounded plus brands) for the contact links. The Flaticon license is free with credit, so the footer credits Flaticon. Record this if the icon set changes. |
| Fonts | Currently Google Fonts. Self-host WOFF2 and record licenses before launch. |
| Résumé | Secondary action. Owner to supply. |
| Contact links | Done: two email addresses, LinkedIn, GitHub and the 30 minute booking link. |

## Delivery rules

Descriptive file names. Declare image dimensions. Alt text for evidence images, empty alt for decoration. Keep pipeline diagrams as live markup so text stays selectable. Keep unfinished source material out of the shipped bundle.
