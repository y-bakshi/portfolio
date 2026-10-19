# Non-functional Requirements

Status: targets. The ones that are implemented are marked in [testing](../testing/testing-strategy.md); none is a production measurement.

| ID | Area | Target and verification |
| --- | --- | --- |
| NFR-01 | Responsiveness | Equal desktop/mobile functionality from 320 px to wide desktop; test portrait, landscape, touch, keyboard, and virtual-keyboard layout. |
| NFR-02 | Accessibility | Target WCAG 2.2 AA. Semantic structure, visible focus, descriptive labels, readable contrast, reduced motion, transcripts, and 44×44 CSS-pixel touch targets. Automated checks plus manual screen-reader review. |
| NFR-03 | Page performance | Target p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 when sufficient field data exists. Before launch, use repeatable lab runs; do not equate lab scores with field compliance. |
| NFR-04 | Asset budget | Proposed initial compressed transfer ≤500 KB excluding deferred assistant/audio; initial JS ≤100 KB. Measure representative pages and justify exceptions. |
| NFR-05 | Assistant latency | Proposed warm text-response p95 ≤8 s under the agreed small-load scenario. Measure cold starts separately; display progress immediately and allow cancellation. |
| NFR-06 | Reliability | The publication and contact links work independently of AI availability. Retry only transient operations with bounded attempts; quota-store failure disables paid inference. |
| NFR-07 | Cost | Target combined charges ≤$25/month; the Worker's cap is $5/month for the model. Application reservations and provider limits protect spend; alerts alone are insufficient and billing enforcement can lag. |
| NFR-08 | Privacy | Do not persist raw IPs in application data. Store only redacted, unattributed questions and optional ratings; restrict diagnostic retention and review managed-service access logs separately. |
| NFR-09 | Security | Keep secrets server-side. Verify the bot check and the owner's Access login, validate inputs and actions, constrain origins, limit request sizes, and enforce quotas atomically. Treat model output and retrieved text as untrusted. |
| NFR-10 | Maintainability | Typed content schema, independent provider adapters, versioned API, reproducible lockfile build, documented configuration, and ADR updates for changed decisions. |
| NFR-11 | Discoverability | Pre-rendered indexable case studies, descriptive titles, canonical URLs, sitemap, social previews, and useful image descriptions. |
| NFR-12 | Observability | Track latency, errors, quota outcomes, token usage, estimated spend, and feedback without raw prompts in logs. Request IDs support troubleshooting. |

## Privacy Defaults to Validate Before Launch

Implemented retention: chats, messages, ratings and events 90 days (a daily job deletes them); quota identifiers live only as long as their enforcement window; a visitor can delete their own chat at any time. The privacy page states this. Configure cleanup explicitly. Managed infrastructure may record network metadata independently; avoid promising anonymity beyond verified controls.

Reference: [Core Web Vitals](https://web.dev/articles/vitals), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
