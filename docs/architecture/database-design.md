# Database Design

Status: planned Firestore design; no database exists yet. Portfolio content stays in version-controlled structured files, not Firestore.

## Collections

| Collection / key | Fields | Purpose |
| --- | --- | --- |
| `quota_buckets/{scopeHash_window}` | `scope`, `windowStart`, `requests`, `reservedCostMicros`, `expiresAt` | Burst/daily visitor and network limits; keyed by scoped HMAC, never raw IP. |
| `budget_windows/{period}` | `limitMicros`, `reservedMicros`, `settledMicros`, `periodStart` | Global daily and monthly AI/speech budget admission. |
| `requests/{requestId}` | `sessionHash`, `status`, `reservationMicros`, `actualMicros`, `createdAt`, `expiresAt` | Idempotency, settlement, and recovery without storing raw prompts. |
| `answer_cache/{contentModelPromptHash}` | `answer`, `citations`, `actions`, `contentVersion`, `expiresAt` | Public portfolio-only answers; exclude personal or sensitive visitor content. |
| `questions/{randomId}` | `redactedQuestion`, `category`, `createdAt`, `expiresAt` | Content improvement; no session hash, IP, transcript, or request linkage. |
| `feedback/{randomId}` | `rating`, `topic`, `createdAt`, `expiresAt` | Optional ratings with no free-text field initially. |

Amounts use integer millionths of USD to avoid floating-point budget errors. UTC defines application quota windows; Firestore billing reset behavior is independent.

## Admission Transaction

Validate input and attestation before database work. A single transaction reads the applicable visitor/network/global limits and idempotency record, checks remaining capacity, increments counters, and reserves conservative maximum provider cost. Make the external call only after the transaction commits. Transaction retry callbacks must never invoke providers.

Settle actual token/character cost afterward, releasing unused reservations. Ambiguous provider outcomes retain their reservation until reconciliation; automatic release must not enable overspend. Prevent duplicate concurrent calls using a request status/lease. Expired entries remain invalid even before physical deletion.

## Access and Retention

Server service account is the only data client; browser Firestore rules deny all reads/writes. Grant scoped IAM and separate preview/production resources. HMAC secrets stay in Secret Manager. Network identifiers are rotating pseudonyms, not perfect anonymity; shared IPs may share limits.

Redact questions before persistence; if redaction confidence is insufficient, discard them. Do not log original prompts during redaction. Proposed retention is 30 days for redacted questions/ratings and 7 days for diagnostics; quota/request records follow their enforcement/reconciliation needs.

Use a documented scheduled cleanup or Firestore TTL, budgeting for cleanup operations. TTL deletion is delayed and not included in free usage; do not use it as quota-reset logic. Add only indexes needed for expiry or operational queries; exempt long question/answer text where suitable.

References: [Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Firestore pricing](https://cloud.google.com/firestore/pricing), [TTL](https://firebase.google.com/docs/firestore/ttl).
