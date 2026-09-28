# ADR-002: Operational Database

Status: accepted for planned implementation; not provisioned. Date: 2026-09-28.

## Context

The API needs distributed quotas, budget reservations, short-lived cache, redacted questions, and optional ratings. Multiple Cloud Run instances must share admission state. Portfolio content itself should remain versioned and reviewable in Git.

## Decision

Use Firestore Standard for operational state and transactions. Keep project/case-study content in structured source files, exporting a versioned backend knowledge artifact. Start retrieval without a hosted vector database.

## Alternatives

In-memory counters do not coordinate across instances or restarts. A permanently provisioned PostgreSQL/Redis service introduces baseline cost and operation. External serverless databases remain possible but add another vendor and identity boundary.

## Consequences

Firestore suits small document records and transactional reservations without an always-on database service. It bills operations and storage; global budget contention and per-request writes require measurement. Transaction retries must not call paid providers. TTL is delayed and may cost money; logical expiry is independent of physical cleanup.

Use server-only access and retain no raw IPs/prompts in operational records. Revisit if relational reporting, high-contention quotas, or large-scale retrieval materially changes the workload.

References: [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [pricing](https://cloud.google.com/firestore/pricing).
