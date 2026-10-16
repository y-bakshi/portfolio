# ADR-007: Rebuild the interface with Tailwind v4 and shadcn/ui, and explain each project with an animated figure

Status: accepted, October 2026. Supersedes the styling parts of [ADR-005](ADR-005-ask-first-design-direction.md): the guide is no longer the first thing on the home page, and the chat lives in a side panel.

## Context

The first version of the site used about 30 hand-written CSS files, square corners and hard offset shadows, a hero that was mostly a chat feed, and a plain list of stages for each project. It worked, but the pages felt flat, the projects were not explained, and every change meant editing several stylesheets that a test kept in a fixed order.

## Decision

1. **Tailwind v4 with shadcn/ui components.** Colours, fonts and radii are tokens in one file, `src/tailwind.css`. Components are owned in `src/components/ui` (Button, Badge, Tabs). The old stylesheets and the test that policed them are gone.
2. **Keep the palette and the portrait; soften the shapes.** Cream and navy stay. Corners are rounded and shadows are soft, instead of square with hard offsets.
3. **Pages.** Home, Projects, the TestPilot case study, Experience and Contact are separate static pages (each its own HTML file, prerendered), and the chat is a page of its own on phones (`/chat/`, not indexed). The guide is a floating button on every page: on wide screens it opens a side panel, and on phones it goes to the chat page. The home page shows the first screen and the work history, no longer a chat feed.
4. **Figures.** Each project is explained by an animated flow chart (flat navy boxes with hard shadows, arrows, a travelling packet), driven by data in `src/content/diagrams` and drawn by the code in `src/diagrams/flow`. An earlier isometric production-line version (built on the Anatomy kit, then on Hairline) was replaced because owners and visitors could not read it as a flow.
5. **Icons and logos.** Hugeicons (free) for interface icons, Morphicons for toggles, and technology logos from theSVG copied to static files.
6. **The guide's face.** An original animated blob and eyes (`src/Guide/Avatar`). The architecture (a radius for each angle, eased between moods, a pure function of time) follows bloub (MIT); its measured shapes are not used, because they reproduce a trademarked mark.
7. **Small files.** A test fails any source file over 220 lines (the vendored kit excepted).

## Consequences

- Every page is styled with utilities, so a visual change is a change to one component. There is no stylesheet order to keep.
- The figures add real weight. They are built only when near the screen, and the prerendered HTML carries a placeholder, so the Projects page's HTML is about 190 KB, not 1.25 MB.
- A figure is only as accurate as its data. Step text is written from the same facts as the project card and is checked by `diagrams.test.ts` for structure (every belt joins real stations, every route follows belts, every station is visited), not for truth.
- Radix (inside shadcn) and Morphicons add about 30 KB gzipped to the shared script.
- The logos are trademarks of their owners and one (Rust) is CC BY-SA 4.0; the footer says so.
