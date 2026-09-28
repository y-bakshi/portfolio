# UI Design Language

Status: implementation specification. The editorial direction is agreed; numerical tokens below are proposed starting values to validate in the first visual prototype. Exact font families remain open.

## Identity and Character

The portfolio reads like a mid-century technology journal: precise, thoughtful, and readable. Use the supplied newspaper references for hierarchy, typography, exhibit diagrams, and annotation marks, while composing original layouts around Yash's work.

**Masthead:** Yash Bakshi

**Subtitle:** *A Technical Journal of Systems Built and Problems Solved.*

**Working editorial lead:** *AI becomes useful when engineering carries it beyond the demo.*

Desktop and mobile are equally important. The print-inspired aesthetic must support comfortable reading and modern interaction on both. Keep technical implementation details out of visitor-facing copy unless they help explain a project.

## Palette

| Token | Initial value | Usage |
| --- | --- | --- |
| `--paper` | `#F4F0E6` | Main reading surface. |
| `--paper-raised` | `#FFFCF5` | Assistant panel, inset figures, focused surfaces. |
| `--paper-inset` | `#EAE4D6` | Subtle highlighted rows and facts panels. |
| `--ink` | `#22201C` | Body copy, headlines, primary button background. |
| `--ink-muted` | `#625D53` | Captions, dates, secondary metadata. |
| `--annotation` | `#913C32` | Editorial labels, stamps, selected-state marks. |
| `--rule` | `#C8C0B1` | Decorative dividers and column separators. |
| `--control-border` | `#817A6D` | Visible input and control boundaries. |

Keep red accents sparse; they draw attention to evidence, status, and actions. Do not use pale decorative rules as the only boundary of an input. Focus, selection, and error states require text, outlines, or icons as well as color. Validate contrast on the actual background, including textured and inset surfaces.

## Typography

| Role | Treatment | Initial size |
| --- | --- | --- |
| Masthead | High-contrast display serif, regular weight, tight but legible spacing. | `clamp(2.75rem, 8vw, 6rem)` |
| Editorial headline | Display serif; deliberate short line breaks. | `clamp(2rem, 4.5vw, 4rem)` |
| Section heading | Serif, clear hierarchy, thin rule above or below. | `clamp(1.75rem, 3vw, 2.5rem)` |
| Standfirst | Reading serif, slightly larger than article text. | 20–24 px |
| Article body | Readable serif with 1.6–1.75 line height. | 18 px |
| Controls | Clear sans serif, labels in sentence case. | 16 px |
| Metadata | Condensed sans or monospace, restrained tracking. | 12–14 px |
| Code and measurements | Monospace with tabular numerals where useful. | 14–16 px |

Use italic serif for the subtitle and occasional captions. Reserve uppercase for brief exhibit labels and metadata; paragraphs and long button labels use normal casing. Body text remains left-aligned with a 55–75-character measure; do not force justified columns on screen. Drop caps may introduce one editorial paragraph, not every section.

Select fonts for both visual fit and web licensing. Self-host subsetted WOFF2 where permitted, provide sensible fallbacks, and avoid loading all weights. Use system-serif/sans/monospace fallbacks until actual font selection and layout-shift testing are complete.

## Layout and Spacing

Use CSS Grid for page composition and semantic document order for reading. Do not flow unrelated interactive modules through newspaper-style CSS columns.

- Reading sheet: maximum width approximately 1200 px, centered, with fluid outside margins.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, and 96 px; favor 24–32 px column gutters.
- Wide layout: masthead, ruled navigation, large lead, then About/portrait/context columns.
- Intermediate layout: two columns where text and diagram sizes remain comfortable.
- Narrow layout: one deliberate reading column, approximately 16 px side padding, full-width exhibits and controls where appropriate.
- Start breakpoint exploration around 640 and 960 px, but switch layouts when content requires it. Verify 320 px through wide desktop.

Use 1 px rules and slightly stronger section boundaries. Most surfaces have square corners; small radii are reserved for controls where useful. A subtle outer-sheet shadow is optional. Avoid elevated dashboard cards, large pill-shaped containers, and heavy shadows across the publication.

## Component Vocabulary

### Masthead and Navigation

Place the name prominently with its italic subtitle. Edition/location/date labels are secondary and must contain accurate data. Desktop navigation uses a ruled row; narrow layouts use an accessible labeled menu or wrapping links. Navigation remains available without assistant activation.

### Hero and About

The thesis is the lead story. Follow it with concise background, an engraved/halftone portrait derived from a real approved photograph, and selected factual context. Contact is the primary conversion; the guide is a prominent exploration action. Keep the greeting brief and avoid automatically opening an intrusive assistant panel.

### Project Exhibits

Use a diagram beside an editorial abstract on wide screens and above it on narrow screens. Each exhibit includes a label, project name, category, short description, restrained technology tags, and clear case-study/source links. Separate entries with rules. Red stamps may indicate verified awards or status; never invent credentials or results for decoration.

Illustrations share black technical line work, sparse red signal paths, fine grids, and captions. Real interface screenshots supplement evidence. Important diagram labels must remain selectable text or authored vector text with accessible explanations.

### Case Studies and Lab Report

Case studies use headline, standfirst, compact facts panel, readable article body, figure captions, and results callouts. Pull quotes must come from genuine project statements. Provide text summaries for detailed diagrams and usable scrolling/zoom where needed.

The lab report presents technologies with contextual evidence and experience categories. It must not imply measured proficiency through arbitrary percentages. Keep table headings and associations accessible when adapting to narrow layouts.

### Buttons, Links, and Forms

Primary button: ink fill with light paper text. Secondary button: paper fill with a visible ink border. Inline links are identifiable without hover, usually by underline. Provide distinct hover, pressed, focus, disabled, loading, and error states. Use a visible 2 px focus outline with offset; target controls at least 44×44 CSS pixels. Forms use persistent labels, clear helper/error text, and adequate input contrast.

## Assistant Visual System

Start with Bloub close to its current form, using ink and paper colors and preserving its attribution. Place the avatar within the same editorial surface vocabulary; avoid a separate futuristic visual theme.

Desktop: compact launcher expanding to a readable inset panel. Mobile: bottom control expanding to a sheet that respects safe areas and the virtual keyboard. Maintain transcript/input/stop/close access and keep underlying page navigation reachable. Apply dialog semantics and focus trapping only when the sheet is actually modal.

Pair each avatar state with a text label: listening, thinking, speaking, navigating, or unavailable. Answers use readable text and source links. A spotlight uses a thin annotation outline and short explanatory label, then settles; it never replaces keyboard focus styling.

Quota and error states use calm text with next steps. Speech is optional, starts after visitor interaction, and has visible mute/stop controls. The assistant should match the journal's tone while adapting technical depth to the question.

## Texture, Motion, and Accessibility

Paper grain is subtle, static, and decorative. Do not distress text or place strong noise behind paragraphs. Use authored SVG for rules, stamps, icons, and architecture diagrams; use optimized raster formats for portraits and screenshots. Keep image dimensions explicit to prevent layout movement.

Use short 120–200 ms control transitions and restrained 200–350 ms panel transitions. Guided scrolling may animate when motion preferences allow; reduced motion uses immediate navigation and a static avatar state. Avoid continuous page-wide motion, parallax, scroll hijacking, and flashing highlights.

Validate keyboard and screen-reader navigation, 200% text zoom, narrow layouts, touch, virtual keyboards, light/dark browser chrome, and orientation changes. The publication's initial palette is light newsprint; a dark theme requires its own design decision rather than automatic color inversion.

## Review Checklist

- Identity and hierarchy follow the masthead, thesis, About, and project narrative.
- Desktop and mobile retain the same essential content and actions.
- Body copy, captions, labels, diagrams, and controls are readable at actual device sizes.
- Contact, filters, and assistant remain operable with keyboard and touch.
- Decorative paper/ink treatments do not impair contrast or performance.
- Empty, loading, error, denied-permission, and rate-limited states are designed.
- Artwork and fonts have recorded provenance/licenses; project claims have evidence.

Related documentation: [UI flow](ui-flow.md), [wireframes](wireframes/README.md), [quality requirements](../requirements/non-functional-requirements.md), and [frontend decision](../decisions/ADR-001-frontend-framework.md).
