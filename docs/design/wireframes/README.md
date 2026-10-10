# Wireframe Specifications

Text wireframes specify hierarchy; the built page in `apps/web` is the reference for final visuals. Desktop and mobile carry the same content and actions.

## Desktop homepage

```text
┌─────────────────────────────────────────────────────────┐
│ Yash Bakshi (sticky)          Projects  History  Contact│
├─────────────────────────────────────────────────────────┤
│              large centred portrait                     │
│              short introduction                         │
│ ┌──────────────────────────────┐   ┌───────────────┐   │
│ │ Ask about my work  [ Ask ]   │   │               │   │
│ │ question chips               │   │   portrait    │   │
│ │ ● status light + text        │   │               │   │
│ │ answer + "Show …" buttons    │   └───────────────┘   │
│ └──────────────────────────────┘                        │
├─────────────────────────────────────────────────────────┤
│ Projects: name + line | detail, role, trace, stack, link│
│   (repeated rows, open, divided by rules)               │
├─────────────────────────────────────────────────────────┤
│ Work history: dates | role and note                     │
├─────────────────────────────────────────────────────────┤
│ What I work with: grouped list                          │
├─────────────────────────────────────────────────────────┤
│ ████ Have a problem worth working through? ████████████ │
│ ████ email, LinkedIn, GitHub, book a 30 minute call ███ │
└─────────────────────────────────────────────────────────┘
```

## Mobile homepage

Single column in the same order: header, portrait, introduction, projects, history, tools, contact. The guide bar spans the bottom of the screen and opens the chat full screen, holding the conversation. Rows stack name first, then detail and trace.

## Case study

Back link, headline, standfirst, trace, problem, approach, results (or "evidence pending"), with a facts panel for role, stack, source and demo beside the text on wide screens and below it on narrow screens.

Avoid rigid columns on phones, tiny metadata, text baked into images, and any invented dates, availability, awards or metrics.
