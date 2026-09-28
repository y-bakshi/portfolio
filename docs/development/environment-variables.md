# Environment Variables

The current scaffold requires no environment variables. The following names are proposed contracts, not implemented configuration. Add sanitized package-level `.env.example` files when code begins reading them.

## Frontend Build Configuration

| Variable | Purpose | Classification |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Canonical deployed origin. | Public |
| `PUBLIC_API_BASE_URL` | Prefer same-origin `/api/v1`; local development override. | Public |
| `PUBLIC_FIREBASE_API_KEY` | Firebase client project identifier. | Public; restrict API/domain use |
| `PUBLIC_FIREBASE_PROJECT_ID` | Firebase project selection. | Public |
| `PUBLIC_FIREBASE_APP_ID` | Registered web application. | Public |
| `PUBLIC_RECAPTCHA_SITE_KEY` | App Check attestation site key. | Public |
| `PUBLIC_SCHEDULING_URL` | Approved calendar destination. | Public |

Astro public variables are exposed in the client build. Do not put provider secrets in any `PUBLIC_*` value. Changing build configuration requires rebuilding the static site.

## Backend Runtime Configuration

| Variable | Purpose |
| --- | --- |
| `APP_ENV`, `GCP_PROJECT_ID` | Environment and scoped project. |
| `ALLOWED_ORIGINS` | Explicit website origins; no production wildcard. |
| `MODEL_PROVIDER`, `MODEL_NAME` | Selected grounded-answer provider/model. |
| `MODEL_API_KEY` | Provider secret, only if API-key authentication is needed. |
| `TTS_PROVIDER`, `TTS_API_KEY` | Optional voice adapter and secret if needed. |
| `SESSION_SIGNING_KEY`, `RATE_LIMIT_HMAC_KEY` | Session integrity and rotating quota pseudonyms. |
| `DAILY_VISITOR_LIMIT`, `DAILY_NETWORK_LIMIT` | Validated positive request limits. |
| `DAILY_AI_BUDGET_MICROS`, `MONTHLY_AI_BUDGET_MICROS` | Integer spend admission limits. |
| `MAX_INPUT_TOKENS`, `MAX_OUTPUT_TOKENS` | Bounded model usage. |
| `AI_ENABLED`, `VOICE_ENABLED` | Operational kill switches. |

Use Secret Manager for secrets and workload identity/attached service accounts for Google access. Cloud Run supplies `PORT`; the container must bind `0.0.0.0` on that value. Emulator and App Check debug configuration belong only in development. Validate required settings at startup; fail closed for paid features when protection is missing.
