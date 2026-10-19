# Functional Requirements

Status: FR-01 to FR-09, FR-11, FR-12 and FR-13 are implemented; FR-10 (voice) is not built. IDs are stable references for implementation and tests.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-01 | Editorial identity | Header and footer read “Yash Bakshi”; the hero shows the portrait and a short introduction. Hero communicates AI application engineering backed by backend and cloud delivery. |
| FR-02 | About and professional record | Show verified experience, education, contribution boundaries, and current focus; no invented metrics or credentials. |
| FR-03 | Project catalog | Include the broader project catalog, emphasize AI and SDE work, and filter by category without losing keyboard access or empty-state feedback. |
| FR-04 | Editorial case studies | Each published case study includes problem, solution, technology, results, a diagram, and available source/demo links. Distinguish measured, estimated, and planned outcomes. |
| FR-05 | Skills report | Present technologies with supporting experience or project evidence; avoid arbitrary percentage rankings. |
| FR-06 | Contact | Offer email, LinkedIn, GitHub, and a scheduling link. Do not expose a broken calendar action while its destination is undecided. Résumé download is secondary. |
| FR-07 | Text assistant | Accept questions about the portfolio and relevant technical concepts; provide concise answers with optional depth and citations for personal claims. Admit missing evidence. |
| FR-08 | Guided navigation | Assistant scrolls to and spotlights an existing project, then offers to open its case study. Validate every action against known IDs and routes. |
| FR-09 | Assistant presence | Automatic text greeting, hero entry action, and persistent control. A status light with matching text covers ready, thinking, answering and error states; listening, speaking and navigation states are added with those features. |
| FR-10 | Optional voice | Provide microphone and speech controls after interaction. Permission denial or unsupported audio never prevents typed conversation. Stop/cancel interrupts playback. |
| FR-11 | Usage controls | Enforce burst, visitor, network, and global quotas server-side; return reset guidance. Navigation, contact, and static content remain available during AI shutdown. |
| FR-12 | Privacy and feedback | Disclose anonymous question retention, provide optional helpful/unhelpful ratings, redact sensitive content before storage, and expire diagnostic data. |
| FR-13 | Desktop and mobile parity | All essential functions work with mouse, touch, and keyboard; layouts adapt without hiding primary content. |

## Scope Boundaries

The assistant may explain technologies represented in the work; it is not a general-purpose chatbot. It cannot execute code, edit the website, contact people, schedule appointments autonomously, or submit applications. Site navigation is a small allowlisted command interface, not arbitrary model-generated DOM manipulation.

The site is live. Voice and its provider remain an open, optional decision; the model is Gemini, the domain is `yashbakshi.com`, scheduling is a booking link, and the quotas are in [protection](../deployment/protection.md).
