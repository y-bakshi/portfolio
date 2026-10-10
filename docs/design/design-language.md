# UI Design Language

Status: implemented in `apps/web`. Direction agreed 2026-10-09, replacing the earlier mid-century journal concept (see [ADR-005](../decisions/ADR-005-ask-first-design-direction.md)). Token values below match `apps/web/src/styles/global.css`; change them there and here together.

## Concept

The page is a working surface built around the portfolio guide. The first thing a visitor can do is ask a question about the work. Answers cite real project rows, and the cited row is highlighted in amber on the page. That highlight is the one memorable moment. Everything else stays quiet and plain.

The portfolio must stay fully useful without the guide: every project, the work history, tools and contact details are ordinary content that reads and links without JavaScript-driven features.

**Masthead:** Yash Bakshi (small wordmark in the sticky header).

**Hero:** on desktop (above 900 px) the portrait fills the left, as large as the window height allows, and the right column is the conversation: the introduction as a square-cornered chat bubble with its tail pointing at the portrait, then each question (cobalt bubble) and answer (panel bubble) with the "Show" navigation buttons beneath. The hero fills the first screen, so Projects starts below the fold. On phones the portrait is centred with the introduction bubble under it, tail pointing up, and the conversation happens in the bottom drawer. The portrait forms out of mist. There is no display headline; the page's `h1` is visually hidden text naming the person.

## Palette

| Token | Value | Usage |
| --- | --- | --- |
| `--ground` | `#EDEFE9` | Page background. |
| `--panel` | `#F9FAF6` | Guide console, trace panels, facts panel. |
| `--ink` | `#14211B` | Text, borders, offset shadows, contact block. |
| `--muted` | `#4A5A52` | Secondary text. About 6:1 on the ground. |
| `--line` | `#B8C1BA` | Row dividers. |
| `--action` | `#2440E8` | Primary action fill, trace bars, text links. |
| `--mark` | `#F5C542` | Citation highlight, card hover, and text selection. Do not use it as decoration elsewhere. |

Muted grey and the cobalt link drop below 4.5:1 on amber, so text inside a highlighted or hovered card switches to full ink (the link also gets an underline). Hover applies only on devices that can hover.

The status light uses red `#FF4D3D`, yellow `#FFC933` and green `#35D07F` on an ink pill. It always appears with a text label, so colour is never the only signal.

## Typography

| Role | Face | Notes |
| --- | --- | --- |
| Headlines, labels, buttons | Instrument Sans, variable width | Width 75 to 80 percent and the heaviest weight (700) for display. Letter spacing slightly negative, never so tight that glyphs touch. |
| Reading text, chat bubbles, card descriptions | Geist | 17 to 18 px, line height 1.55 to 1.65, measure about 62ch. Body text is weight 450 and card descriptions and bubbles weight 500, because Geist's regular weight looks thin beside the heavy borders and shadows. |
| Pipeline traces only | Geist Mono | Used where the content is literally a pipeline stage list. Not for decorative labels. |

Fonts load from Google Fonts. Self-host subsetted files and record licences before launch.

Sentence case throughout. No all-caps labels, no eyebrow above every heading, no middle-dot metadata strings. Fonts load from Google Fonts for now; self-hosting subsetted WOFF2 is a pre-launch task.

## Layout

- Left aligned. Content width up to 1240 px with a fluid gutter of 20 to 72 px.
- The sticky header spans the full width with the ground colour and a thin rule.
- Any text that would sit straight on the dot grid goes on a card too: the introduction, each section's heading and lead-in, the small footnotes, and the case-study title and body. There are no text halos or shadows.
- The tools list is a single card in the same style, with its four groups inside it.
- Each project and each role is its own card, styled like the guide dock: panel fill, 2 px ink border and a hard offset shadow (8 px for projects, 6 px for roles, smaller on phones). Inside a project card the name and one line sit on the left and the detail, trace, stack and link on the right; they stack on screens under 820 px.
- The hero is the portrait and the introduction card, centred. The guide is a docked chat fixed to the bottom right and minimised to a bar on load (see the guide dock component).
- Spacing is fluid with `clamp()`. Section gaps run roughly 56 to 112 px.
- Depth comes from hard offset shadows (8 px on project cards, 6 px on the facts panel). No soft grey shadows.

## Components

- **Guide voice:** the page speaks as Yash in first person; the guide is introduced as an assistant that answers from his project notes and refers to him in the third person. It never claims to be him.
- **Guide chat:** closed, a small bar fixed at the bottom right ("Ask the guide", status text, status light, chevron). On desktop, clicking it widens the bar into an input bar along the bottom (suggested-question chips in a scrolling row above the input, the status light, Ask and a close button); on desktop the open bar spans the full window width, answers appear in the hero's right column, not in the bar, earlier exchanges stay above the newest one, the column is a fixed height with no scrollbar and no manual scrolling: the newest message stays in view, older ones fade out at the top, and streaming text never moves the page, and the page scrolls the conversation into view above the bar. On phones (900 px and under) the bar spans the bottom edge and opens a bottom drawer, 72 percent of the height, with a handle, a header with status and close button, the conversation (newest question pinned to the top; the suggested-question chips until the first question, then all of them as one row above the input that scrolls sideways with its scrollbar hidden) and the input at the bottom, over a light scrim; Show closes the drawer so the cited card is visible. While the on-screen keyboard is open the drawer sits above it and is never taller than the visible area (it reads the visual viewport and publishes `--kb` and `--vvh`). Escape or the close button dismisses it and returns focus to the bar, and asking a question opens it. The panel is `inert` while closed. It uses the elements below: labelled input, Ask button, suggested-question chips, status light with text, answer text (streamed text is hidden from assistive tech until done, then announced once through a polite live region, and the status text is a separate live region), and navigation buttons that jump to a cited card (visibly just the project or role name, centred under the answer; the accessible name says "Show … on the page"). Guide messages align left, the visitor's right. Asking a new question scrolls the page back to the conversation, and a "Back to top" button appears in the open bar once the page is scrolled. Ask is available whenever the guide is ready. An empty submit moves focus to the input.
- **Status light:** red while answering, yellow while thinking, green when ready, with matching text: "Answering, one moment", "Looking through the notes", "Ready for your question".
- **Trace:** a waterfall of pipeline stages, each starting one step right of the last. It shows order only. Do not add timings unless they are measured.
- **Project card:** see Layout. A project with a published case study links to it; others say the case study is in preparation.
- **Contact block:** a full-width ink band attached to the bottom of the page (the footer continues it), with the heading on the left and the links on the right on wide screens, stacked on narrow ones, with a single question as its heading and plain links, each with a Flaticon icon on the left and text on the right: two email addresses, LinkedIn, GitHub and a 30 minute booking link that opens the owner's Google Calendar page in a new tab. The footer credits Flaticon.
- **Case study:** headline, standfirst, trace, problem, approach, results, with a facts panel for role, stack, source and demo. Results stay "evidence pending" until verified.

## Motion

- A grid of round ink dots is fixed behind the whole page, 14 px apart, clearly visible but quiet. Dots near the pointer, wherever it is on the page, are pushed away from it (the push radius, 100 px, is one shared constant in `pointerPush.ts`, used by the portrait too so both clear the same-sized gap) and spring back when it moves on, so the cursor parts the grid. The loop sleeps once the pointer stops and the dots settle. It is decoration only (`aria-hidden`), drawn once and static under reduced motion. Panels with a solid background cover it, and the portrait is opaque inside the figure so no dots show through the face.
- The portrait forms out of a rotating sphere of suspended ink particles when it scrolls into view (about 3.6 seconds, once). The face region gets extra particles so it stays recognisable while forming, and in the last stretch the engraving itself fades in under the particles so the finished face is crisp. The pointer pushes particles aside and they drift back. Reduced motion, or a failed image load, shows the finished picture instead. The animation loop stops once the portrait is formed and at rest, particles are drawn in alpha buckets (one path each), a stir wakes only the tiles near the pointer and redraws them as small round specks of the picture's own tone, never squares, phones get fewer particles, the portrait is sampled in small slices that yield to the browser so the page never blocks on it, and if frames run slower than about 25 fps it draws every other particle. The page and header dot grids likewise stop when the pointer stops.
- New chat bubbles enter from 8 px below with a 220 ms ease-out fade (only the newest exchange; earlier ones are not replayed). The desktop bar opens by revealing a full-width bar with `clip-path`, not by animating its width, and its content fades out over 120 ms before it collapses. The citation highlight is a clip-path sweep on a layer behind the text. Jumps of more than a screen and a half are instant instead of smooth. A route change opens the new page at the top unless the link has a hash.
- The guide streams its answer word by word. Reduced motion shows the full answer immediately.
- All jumps (nav links, the name link, skip link, "Show" buttons) use one stylesheet-level smooth scroll. The citation highlight starts after the jump has mostly arrived.
- No scroll-triggered entrance effects, parallax or hover animation on every card. Reduced motion turns off smooth scroll, the portrait animation and the highlight sweep.

## Accessibility and quality floor

- Visible 3 px cobalt focus ring with offset. Controls are at least 44 px tall.
- Skip link, labelled landmarks, and one `h1` per route.
- Text contrast checked on the ground, panel and amber surfaces.
- Verify at 320 px through wide desktop, 200 percent text zoom, keyboard only, and with reduced motion.
- Empty, loading and miss states are designed: the guide says plainly when a question is not in the notes.

## Review checklist

- The guide works with keyboard and touch, and the page is complete without it.
- Every claim on the page has a source in the content notes; nothing is invented.
- Placeholders are visibly bracketed until real values exist.
- No element exists only as decoration.

Related documentation: [UI flow](ui-flow.md), [wireframes](wireframes/README.md), [asset brief](asset-brief.md), [quality requirements](../requirements/non-functional-requirements.md).
