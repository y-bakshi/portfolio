# UI Asset Brief

This is the version-controlled asset specification for contributors. It carries the relevant guidance from the owner's private working brief. Use it with [design language](design-language.md) and the [reference gallery](references/README.md).

## Art Direction

Create a readable mid-century technology journal: warm cream paper, faded near-black ink, sparse brick-red annotations, technical line art, fine rules, exhibit labels, and captions. Keep textures subtle. Avoid neon AI imagery, glossy 3D renders, heavy distressing, torn-paper collage, ornate Victorian decoration, and illegible small labels.

## Portrait

Source asset is still needed from Yash. Prefer a sharp, minimally processed photo with face and upper torso visible, soft directional light, and an uncluttered background; approximately 2000 px on the shortest side where available. Create an engraved/halftone derivative and validate identity manually. Preserve the approved original separately.

Draft transformation prompt:

> Convert the supplied portrait into a faithful mid-century technology-journal engraving. Preserve identity, proportions, expression, hairstyle, clothing, and pose. Use crisp black crosshatching, stippling, controlled halftone density, and readable contours on a transparent background. No caricature, invented objects, text, border, paper background, photorealism, or digital glow.

Image generation produces raster artwork; only use SVG when creating or deliberately vectorizing an asset. Export optimized WebP/AVIF plus responsive variants for a raster portrait.

## Project Illustrations

| Project | Exhibit concept |
| --- | --- |
| TestPilot | Repository → retrieved coding standards/defect analysis → generated tests → critique gate. |
| GuardianAI | Incident map and feeds → database summary path or ReAct reasoning path → safety response. |
| CityWatch | Social signals → Kinesis/Lambda → vision and LLM classification → department alerts. |
| Face recognition | Separate detection/recognition inference stages linked by an SQS queue. |
| CatScript | Source → lexer/parser → AST → type checking → interpreter. |
| Streaming pipeline | Taxi events → Kafka consumer → Neo4j, coordinated through Kubernetes. |

Verify each diagram against actual project evidence before rendering it as architecture. Use authored SVG for precise system labels and flows; generated art may support composition, not establish technical truth.

Base illustration prompt:

> Mid-century engineering-journal illustration, precise black ink line art, orthographic components, fine measurement ticks, restrained crosshatching and halftones, one muted brick-red path showing primary data flow, clean rectangular composition, transparent background, consistent drafting style. No gradients, 3D rendering, decorative text, logos, neon, or blue.

## Supporting Assets

- Seamless low-contrast paper texture; target under 100 KB if rasterized. Prefer CSS when sufficient.
- Authored vector rules, stamps, exhibit codes, and technical annotations.
- One outlined icon family for email, LinkedIn, GitHub, scheduling, microphone, speech, stop, and transcript controls.
- Bloub integration states: idle, greeting, listening, thinking, speaking, navigating, success, rate-limited, and error. Provide a static reduced-motion state.
- Original social preview and favicon based on the name masthead or approved monogram.
- Actual project screenshots with consistent capture dimensions, secrets removed, and meaningful captions.

## Typography

Select a display serif, reading serif, condensed metadata sans, and technical monospace. Actual families and licenses remain undecided. Test numerals, italics, punctuation, weights, fallback metrics, desktop/mobile readability, and load cost. Self-host WOFF2 where permitted.

## Asset Delivery

Use descriptive names such as `testpilot-retrieval-flow.svg`. Put published static assets in `apps/web/public/` or optimized source assets in `apps/web/src/` when implementation chooses a processing path. Keep diagrams/icons in SVG, images in optimized raster formats, and captions in HTML. Declare dimensions, supply useful alt text for evidence, and empty alt text for decoration.

For every final external/generated asset record source, author, license, prompt/model if applicable, edits, and approval status. Keep unfinished source material out of the shipped bundle.

## Outstanding Assets

| Asset | Status / next action |
| --- | --- |
| Reference screenshots | Included under `references/`; inspiration only. |
| Approved source portrait | Owner to supply. |
| Engraved portrait | Generate after selecting source; approve likeness. |
| Featured exhibit illustrations | Planned; verify diagrams before production. |
| Fonts and icons | Select and record licenses. |
| Paper treatment | Prototype and measure contrast/size. |
| Bloub | Repository selected; integration not implemented. |
| Real project screenshots | Capture from verified project builds. |
| Favicon/social preview | Replace scaffold icons with original identity assets. |
