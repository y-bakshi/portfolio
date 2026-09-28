# Test Cases

Status: acceptance cases to implement; not an executed test report.

| ID | Requirements | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-01 | FR-01/02 | Load homepage with JavaScript disabled. | Editorial identity, About, projects, and contact remain readable. |
| TC-02 | FR-03 | Filter by AI, then select a category with no entries. | Correct catalog and useful empty state; keyboard focus remains stable. |
| TC-03 | FR-04 | Open each case-study route directly. | Correct article, diagram caption, results status, metadata, and working links. |
| TC-04 | FR-07 | Ask about TestPilot's RAG. | Answer uses verified evidence and links to its case study. |
| TC-05 | FR-07 | Ask for an unsupported achievement or unrelated task. | No fabricated claim; explain scope or missing evidence. |
| TC-06 | FR-08 | Provider emits unknown ID, external URL, or script. | Action rejected; page does not navigate or execute content. |
| TC-07 | FR-08/09 | Guide spotlights a project and visitor closes it. | Known anchor highlighted; focus returns appropriately; case page opens only on choice. |
| TC-08 | FR-10 | Deny microphone permission or use unsupported speech API. | Typed conversation and text answers remain usable. |
| TC-09 | FR-10 | Stop audio or cancel request during response. | Playback stops; late response cannot restart audio or trigger navigation. |
| TC-10 | FR-11 | Submit concurrent calls at the quota boundary. | Atomic admission never exceeds the configured limit; denied calls do not invoke provider. |
| TC-11 | FR-11 | Retry the same paid request/idempotency key. | No duplicate inference charge; conflicting payload returns an error. |
| TC-12 | FR-11 | Fail Firestore, exhaust budget, or time out provider. | Paid inference fails closed; static content remains usable; cost reservation handled safely. |
| TC-13 | FR-12 | Submit a question containing email/IP/secret-like text. | Original prompt absent from storage/logs; unsafe text redacted or discarded. |
| TC-14 | FR-12 | Submit optional rating twice. | Defined duplicate handling; no session/IP linked to retained question data. |
| TC-15 | FR-13 | Test 320, 375, 768, 1024, and 1440 px, both orientations. | No unintended page overflow, clipped controls, lost information, or blocked contact links. |
| TC-16 | NFR-02 | Navigate with keyboard and screen reader. | Logical reading order, visible focus, labeled controls, restrained announcements. |
| TC-17 | FR-13 | Open guide with virtual keyboard and safe-area inset. | Input and send/close controls remain visible and usable. |
| TC-18 | NFR-09 | Missing/expired attestation/session, spoofed origin, oversized body. | Reject before provider call; return documented error; no secrets exposed. |
| TC-19 | FR-06 | Open contact options and résumé link. | Real approved destinations; no placeholder calendar or dead download. |
| TC-20 | NFR-07 | Simulate reservation settlement and ambiguous provider failure. | Used spend retained; unused reservation released only with safe reconciliation. |

Record browser/device, content revision, provider configuration, observed result, and evidence when running cases. Mark skipped cases and why; do not mark planned cases as passed.
