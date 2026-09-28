# Infrastructure

Status: intended GCP resources; nothing has been provisioned by this task.

| Resource | Responsibility | Starting policy |
| --- | --- | --- |
| Firebase Hosting | Static CDN, domain/TLS, API rewrite. | Cache immutable assets; revalidate HTML; review release retention. |
| Cloud Run | FastAPI API. | Request billing, minimum 0, bounded instances/deadline; measure before tuning. |
| Artifact Registry | Immutable container images. | Same region as API; cleanup old images with rollback retention. |
| Firestore Standard | Quotas, cache, redacted question/feedback records. | Server-only access, limited indexes, explicit expiry cleanup. |
| Secret Manager | Signing/HMAC/provider secrets. | Least-privilege access and rotation. |
| App Check / reCAPTCHA Enterprise | Client attestation. | Registered production domains, backend token verification, monitored enforcement. |
| Cloud Logging/Monitoring | Operational metrics and diagnostics. | Bounded retention; scrub sensitive payloads and review access logging. |
| Workload Identity Federation | GitHub deployment identity. | Repository/ref-scoped trust, separate deployment/runtime roles. |

Use separate production and development resources where necessary; avoid permanent duplicate workloads within the small budget. Select region after latency, pricing, and service compatibility checks. Do not add a load balancer, NAT, Kubernetes cluster, always-on database, or managed Redis without a measured need and budget revision.

## Budget Controls

Combined target: $25/month. Initial planning envelope is $20 inference/voice and $5 infrastructure, subject to measured traffic and current prices. It is not a guaranteed bill.

Enforce conservative global cost reservations before provider calls, token/voice limits, server-side burst/daily quotas, bounded retries, cache reuse, and AI/voice kill switches. Set billing alerts and eligible spend caps where available. Alerts alone do not stop spending; preview spend caps can lag and do not cover every service. [GCP spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)

Track CDN transfer, attestation, Firestore reads/writes/cleanup, container storage, build usage, logs, egress, and inference separately. Final per-visitor/network/daily caps follow cost experiments; do not select arbitrary published allowances.

## Provisioning

Terraform is the proposed infrastructure definition once deployments begin. Commit resource definitions and sanitized examples, exclude state/credentials, and use a protected remote state location. Provisioning and deletion are separate operational actions, not part of documentation generation.
