# UI Design Language

Status: implemented in `apps/web`. Direction agreed 2026-10-09, replacing the earlier mid-century journal concept (see [ADR-005](../decisions/ADR-005-ask-first-design-direction.md)). Token values below match `apps/web/src/styles/global.css`; change them there and here together.

## Concept

The page is a working surface built around the portfolio guide. The first thing a visitor can do is ask a question about the work. Answers cite real project rows, and the cited row is highlighted in amber on the page. That highlight is the one memorable moment. Everything else stays quiet and plain.

The portfolio must stay fully useful without the guide: every project, the work history, tools and contact details are ordinary content that reads and links without JavaScript-driven features.

**Masthead:** Yash Bakshi (small wordmark in the sticky header).

**Lead:** *I build the part of AI that keeps working after the demo.*

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
| Headlines, labels, buttons | Bricolage Grotesque, variable width | Width 75 to 82 percent and weight 800 for display. Letter spacing slightly negative, never so tight that glyphs touch. |
| Reading text | Source Serif 4 | 17 to 18 px, line height 1.65, measure about 62ch. |
| Pipeline traces only | JetBrains Mono | Used where the content is literally a pipeline stage list. Not for decorative labels. |

Sentence case throughout. No all-caps labels, no eyebrow above every heading, no middle-dot metadata strings. Fonts load from Google Fonts for now; self-hosting subsetted WOFF2 is a pre-launch task.

## Layout

- Left aligned. Content width up to 1240 px with a fluid gutter of 20 to 72 px.
- The sticky header spans the full width with the ground colour and a thin rule.
- The tools list is a single card in the same style, with its four groups inside it.
- Each project and each role is its own card, styled like the guide console: panel fill, 2 px ink border and a hard offset shadow (8 px for projects, 6 px for roles, smaller on phones). Inside a project card the name and one line sit on the left and the detail, trace, stack and link on the right; they stack on screens under 820 px.
- The hero places the guide console and the portrait side by side on wide screens. On narrow screens the portrait comes first, then the console.
- Spacing is fluid with `clamp()`. Section gaps run roughly 56 to 112 px.
- Depth comes from hard offset shadows (8 px on the console, 6 px on the facts panel). No soft grey shadows.

## Components

- **Guide voice:** the page speaks as Yash in first person; the guide is introduced as an assistant that answers from his project notes and refers to him in the third person. It never claims to be him.
- **Guide console:** labelled input, Ask button, suggested-question chips, status light with text, answer area (status text is a polite live region; streamed text is hidden from assistive tech until done, then announced once), and "Show" buttons that jump to a cited row. Ask is available whenever the guide is ready. An empty submit moves focus to the input.
- **Status light:** red while answering, yellow while thinking, green when ready, with matching text: "Answering, one moment", "Looking through the notes", "Ready for your question".
- **Trace:** a waterfall of pipeline stages, each starting one step right of the last. It shows order only. Do not add timings unless they are measured.
- **Project card:** see Layout. A project with a published case study links to it; others say the case study is in preparation.
- **Contact block:** a full-width ink band attached to the bottom of the page (the footer continues it), with the heading on the left and the links on the right on wide screens, stacked on narrow ones, with a single question as its heading and plain links, each with a Flaticon icon on the left and text on the right: two email addresses, LinkedIn, GitHub and a 30 minute booking link that opens the owner's Google Calendar page in a new tab. The footer credits Flaticon.
- **Case study:** headline, standfirst, trace, problem, approach, results, with a facts panel for role, stack, source and demo. Results stay "evidence pending" until verified.

## Motion

- One load sequence: the three headline lines rise in turn.
- A quiet dot grid is fixed behind the whole page. Dots near the pointer, wherever it is on the page, grow and darken to full ink, the same colour as the portrait's line work, then ease back. It is decoration only (`aria-hidden`) and is skipped under reduced motion. Panels with a solid background cover it, and the portrait is opaque inside the figure so no dots show through the face.
- The portrait forms out of a rotating sphere of suspended ink particles when it scrolls into view (about 3.6 seconds, once). The pointer pushes particles aside and they drift back. Reduced motion, or a failed image load, shows the finished picture instead.
- The guide streams its answer word by word. Reduced motion shows the full answer immediately.
- All jumps (nav links, the name link, skip link, "Show" buttons) use one stylesheet-level smooth scroll. The citation highlight starts after the jump has mostly arrived.
- No scroll-triggered entrance effects, parallax or hover animation on every card. Reduced motion turns off smooth scroll, the headline animation and the highlight sweep.

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
