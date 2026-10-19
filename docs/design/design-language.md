# UI Design Language

Status: implemented in `apps/web`, rebuilt in October 2026 (see [ADR-007](../decisions/ADR-007-tailwind-shadcn-redesign.md)). The palette, fonts and radii live in one place, `apps/web/src/tailwind.css`; change them there and here together.

## Concept

A calm, warm working surface: cream paper, navy ink, one gold highlight. The site is an engineering portfolio, so each project is explained by a flow chart you can watch working, not by a list. The guide is a side panel you can open on any page, and a page of its own on a phone. The portfolio stays fully useful without it.

The memorable moments are two: the flow chart for each project, and the guide's face (which falls asleep, and reacts when poked). Everything else stays quiet.

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
| `--wip` | `#FFE600` | The work-in-progress note (off at launch). |

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

- **Header:** the name, Projects, Contact and GitHub. The current page is underlined. Under 640 px the links fold into a menu. Experience is not here: it is on the home page now (the `/experience/` page still exists for old links and the guide's buttons).
- **Project row:** name, what it is and what Yash did, the technologies as one line of text, a folded "About this project" with the longer write-up, and the links the project really has (the case study for TestPilot; a source, demo or deck for the others). The flow chart sits on the right, without its steps list. The home page's project cards and technology strip are switched off in `layout/features.ts`.
- **Figures:** see below.
- **Guide:** a floating "Ask the guide" button on every page. On a wide screen it opens a 26 rem panel on the right; the page behind stays usable, so a source button can scroll to the card it cites, and the panel is `inert` while closed. On a phone it goes to the chat page (`/chat/`, not indexed) instead, with a back arrow, so the browser's own back button works. While the page scrolls the button shrinks to just the face (a clip and a slide, no layout change), and a press that starts while it is shrunk opens the chat. A source on another page goes to that page. The suggested questions sit under the conversation, and on a phone they all go once one is tapped. The answers to the four suggested questions are kept in the database (see `worker/lib/answer-cache.ts`) so the model is paid for them once.
- **Guide face:** a navy blob with two eyes (`Guide/Avatar`). It breathes, blinks and drifts its gaze at rest, looks up and darts its eyes while it thinks, opens and shuts a mouth while it answers, and widens its eyes while someone types. Left alone for 40 seconds with the chat open it falls asleep (eyes shut, floating z's). Tapping it makes it wink, spin dizzily, or burst into sparks, in turn. It is a pure function of time (`engine.ts`), eased between moods, and still under reduced motion. The idea of a radius for each angle, eased between moods, follows the bloub project (MIT); the shapes and numbers are original.
- **Work-in-progress note:** a thin yellow line above the header. Turned off at launch with `features.wipNotice`; delete it, its token and `layout/WipNotice.tsx` if it is not coming back.
- **Footer:** a navy band with the page links and the credits for the parts that are not Yash's.

## The figures

Each project is drawn as a flow chart (`src/diagrams/flow`): a flat box for each step, with a navy outline and a hard offset shadow, an icon, its name in bold and a small word for the kind of step (Input, Process, Data, Check and so on). Arrows join the boxes; a loop back is a dashed arc with a few words on it. A small gold packet travels the routes while the chart is on screen. The first step has no box, only its icon and name. The style follows the Cocoon AI architecture-diagram skill (MIT) for grouping, and the owner's reference for the look.

- **Content decides.** What a chart says lives in `src/content/diagrams/*.ts`: steps on a grid (a column along the flow, a row across it), the links between them, the routes the packet takes, and optional groups (a dashed outline round steps the notes name, such as the cloud or a device).
- **One size.** Charts are drawn at one natural size and never stretched. They shrink a little to fit (a six-step chart a little more); below about 540 px they all turn to run top to bottom. `layout.ts` works both ways out in one frame, then turns it.
- **The steps list.** On the case-study page the steps are also listed under the chart, numbered to match the boxes. Pointing at a box or a step, or focusing a step, lights both. Charts on the projects page are bare.
- **Motion.** The packet moves only while the chart is on screen. With reduced motion it holds one frame partway along the first arrow.
- **Honesty.** The figures only say what the project's content says. Step text is written from the same facts as the project row.

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
