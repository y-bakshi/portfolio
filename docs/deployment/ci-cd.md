# CI/CD

Status: proposed GitHub Actions pipeline; `.github/workflows/` is not configured yet.

## Pull Request Checks

Frontend job: checkout → pinned compatible Node version → `npm ci` in `apps/web/` → `npm run check` → `npm run build`. Add content validation, browser/accessibility tests, and documentation-link checks as tooling is implemented. Cache npm downloads, not arbitrary installed dependencies.

Backend job, once created: install from its lockfile → static checks → unit/emulator tests with mock providers → container build and dependency/security scan. CI should not require production API secrets for ordinary PRs.

## Release Pipeline

On reviewed changes to `main`, build immutable artifacts associated with the Git SHA. Publish a restricted staging/preview release, run smoke checks, then use a protected production environment for promotion. During private development, avoid publicly accessible previews; a random URL is not access control.

Use GitHub OIDC with Google Workload Identity Federation and narrowly scoped deployment identities. Avoid long-lived downloaded service-account keys. Production jobs need explicit environment controls and concurrency protection against overlapping releases.

## Permissions and Evidence

Set minimum workflow permissions; grant `id-token: write` only where federation is needed. Untrusted forks must never receive deployment secrets or execute modified code in a privileged release context. Record artifacts, content version, test evidence, and deployment revision without prompt/credential logs.

Coordinate knowledge-index and frontend releases so API citations resolve to the deployed content. Prefer backwards-compatible schema changes; document rollback for incompatible contracts.

Workflow files and required branch checks should be introduced in the roadmap's hardening phase. Commands in this document describe a future workflow rather than runnable release automation.
