# UI Design Language

Status: implemented in `apps/web`, rebuilt in October 2026 (see [ADR-007](../decisions/ADR-007-tailwind-shadcn-redesign.md)). The palette, fonts and radii live in one place, `apps/web/src/tailwind.css`; change them there and here together.

## Concept

A calm, warm working surface: cream paper, navy ink, one gold highlight. The site is an engineering portfolio, so each project is explained by a small machine you can watch working, not by a list. The guide is a side panel you can open on any page. The portfolio stays fully useful without it: every project, the work history and the contact details are ordinary content that reads and links without JavaScript-driven features.

The memorable moments are two: the isometric production line for each project, and the guide's face. Everything else stays quiet.

## Pages

| Page | Path | What it holds |
| --- | --- | --- |
| Home | `/` | Hero with the portrait, the technology strip, the most recent role, the four featured projects as cards. |
| Projects | `/projects/` | Every project as a row with its figure; filter tabs (All, Backend, Cloud, AI, Systems); the smaller projects. |
| Case study | `/projects/testpilot/` | Problem, how it works (with the figure), what was built, measured results as a table, a sticky facts panel. |
| Experience | `/experience/` | Work history as a timeline with logos, and the two degrees. |
| Contact | `/contact/` | Email with a copy button, profiles, a booking card, and links back into the site. |
| Not found | `/404.html` | A way home. |

Every page shares one frame (`layout/PageFrame.tsx`): the work-in-progress note, the sticky header, the footer, the dot grid and the guide.

## Palette

| Token | Value | Usage |
| --- | --- | --- |
| `--ground` | `#E8E0D2` | Page background (ivory). |
| `--panel` | `#F4EFE5` | Cards, the guide panel's bubbles, figure frames. |
| `--ink` | `#0E1D61` | Text, the figures' working parts, the dot grid and portrait (deep atlas navy). |
| `--action` | `#1A2E8A` | Primary buttons, links, active tab. |
| `--muted` | `#4B547F` | Secondary text (5.6:1 on the ground). |
| `--line` | `#BDB09A` | Hairlines and card borders. |
| `--mark` | `#B89A5A` (gold) | The highlight a "Show on the page" button puts on a card; the lid of the packet in each figure. Not decoration. |
| `--field` | `#FBF8F1` | The chat input. |
| `--wip` | `#FFE600` | The work-in-progress note, until launch. |

Tailwind reads these through `@theme inline` (`bg-panel`, `text-ink`, `border-line`, and so on) so there is one palette. `styles.test.ts` checks the contrast pairs (4.5:1) and the selection colours.

## Typography

| Role | Face | Notes |
| --- | --- | --- |
| Headlines, names, step titles | Instrument Sans, variable width | The `display` utility: width 80, weight 800, slightly negative tracking, line height 1.04. |
| Reading text, UI | Geist (variable) | 17 px, line height 1.65, weight 450. |
| Code | Geist Mono | Reserved for literal code and data. |

Fonts are self-hosted through Fontsource (SIL OFL 1.1), so no request goes to a font CDN. Sentence case throughout; no all-caps labels, no eyebrows above every heading.

## Shape and depth

Rounded corners (6 to 20 px), a soft two-layer shadow (`shadow-soft`, `shadow-lift` on hover), hairline borders in `--line`. Buttons lift 1 px on hover and press 1 px on click. Hover applies only where it helps; nothing animates on scroll except the figures.

## Components

All from shadcn/ui (new-york style, owned in `src/components/ui`): Button and Badge (restyled to the palette) and Tabs. Icons are Hugeicons (free set); toggles between two icons (menu and close, play and pause, copy and tick) use Morphicons, which morphs one icon into the other with a spring. Technology logos are copied from theSVG into `public/logos/tech` by `npm run logos:copy`, so they are plain image files loaded only when on screen.

- **Header:** the name, Projects, Experience, Contact and GitHub. The current page is underlined. Under 640 px the links fold into a menu.
- **Project card and row:** name, one line, the role, technology chips with logos, and the links the project really has (the case study for TestPilot; a source, demo or deck for the others). A card shows the figure small; a row shows it large with its steps listed beneath.
- **Figures:** see below.
- **Guide:** a floating "Ask the guide" button on every page. It opens a panel that is a 26 rem column on the right on wide screens and a full-screen sheet on phones. The page behind a wide panel stays usable, so a source button can scroll to the card it cites. The panel is `inert` while closed. Escape closes it and returns focus to the button. A source on another page goes to that page, and the chat is open there. The suggested questions sit under the conversation; the notice that questions are saved for 90 days and the Clear action sit above the input.
- **Guide face:** a navy blob with two eyes (`Guide/Avatar`). It breathes, blinks and drifts its gaze at rest, looks up and turns lumpy while it thinks, pulses while it answers and widens its eyes while someone types. It is a pure function of time (`engine.ts`), eased between moods, and still under reduced motion. The idea of a radius for each angle, eased between moods, follows the bloub project (MIT); the shapes and numbers are original.
- **Work-in-progress note:** a thin yellow line above the header, until launch. Remove it, its token and `layout/WipNotice.tsx` then.
- **Footer:** a navy band with the page links and the credits for the parts that are not Yash's.

## The figures

Each project is drawn as a small production line in isometric view (`src/diagrams`). A navy packet with a gold lid rides belts between machines, and each machine stands for a kind of step:

| Machine | Stands for |
| --- | --- |
| Hopper | Where things enter: a repository, a feed, a prompt. |
| Press | Something made or transformed; its piston comes down on the packet. |
| Cabinet | Something looked up or stored; a drawer slides out. |
| Gate | Something checked; the barrier lifts when the packet passes. |
| Scanner | Something read or analysed; a frame sweeps over the packet. |
| Pusher | A route chosen; a ram shoves the packet onto another belt. |
| Queue | Things waiting their turn. |
| Display | Something shown to a person; a cursor works down the screen. |
| Tray | Where things end up. |

The content decides what a figure says (`src/content/diagrams/*.ts`: stations on a grid, belts between them, the routes a packet takes), the machines are drawn once in `stations/`, and `scene/` lays them on a bench, sorts them back to front, and runs the timeline. The drawing uses the Anatomy kit (MIT), copied into `src/diagrams/iso/vendor`: solids with four-tone shading, painter's order, one accent. A return belt runs behind the line where a step sends work back (TestPilot's critique gate).

- The steps are listed under each figure as a list in the page; pointing at a machine or a step, or focusing a step, lifts the machine and lights the step.
- The drawing has thousands of paths, so it is built only when its frame nears the screen; until then, and in the page's static HTML, a box of the same size holds its place and carries the description.
- The loop runs only while the figure is on screen. With reduced motion it draws one frame, mid-route, and holds still.
- The figures only say what the project's content says. The step text is written from the same facts as the project card.

## Motion

- A grid of round ink dots sits behind the page; dots near the pointer are pushed away and spring back. It is decoration only and static under reduced motion.
- The portrait forms out of suspended ink particles when it scrolls into view (about 3.6 seconds, once). Reduced motion shows the finished picture. A chat that was open before a refresh opens again once the portrait has formed.
- The technology strip scrolls slowly and can be paused; it stands still under reduced motion.
- Panels and cards use a 200 to 300 ms ease-out (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`); things that respond to a person answer within a frame. Reduced motion turns off smooth scroll, the portrait, the strip, the figures' loop and the guide face's movement.

## Accessibility and quality floor

- Visible 3 px navy focus ring with offset. Skip link, labelled landmarks, one `h1` per page.
- Every figure has a text description and its steps as a list; every step can be reached by keyboard.
- The scrollable results table is a focusable region. The filter tabs have the panel they control.
- Text contrast is checked on the ground, panel and gold surfaces, and axe runs on every page with the guide open.
- Verified at 320 px through 1440 px wide with no sideways scrolling, and with reduced motion.

## Code organisation

Small files that each do one job (the test suite fails any source file over 220 lines): one component per file; hooks, data and helpers in their own files; page copy in `src/content`, not in components. Each page is a thin file that composes sections from `src/sections/<page>/`. The vendored anatomy kit under `src/diagrams/iso/vendor` is exempt.

Related documentation: [UI flow](ui-flow.md), [wireframes](wireframes/README.md), [asset brief](asset-brief.md), [testing strategy](../testing/testing-strategy.md).
