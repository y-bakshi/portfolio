# Deployment

Status: deployment plan. No Firebase configuration, Cloud Run service, backend container, or workflow is implemented.

## Topology

Static frontend: Firebase Hosting. Planned API: FastAPI container on Cloud Run. Prefer same-origin `/api/v1/*` hosting rewrites; keep the publication independent of backend availability. Hosting integration imposes a 60-second request timeout, so API deadlines must be shorter. [Firebase integration](https://firebase.google.com/docs/hosting/serverless-overview)

## Frontend Release

1. Configure the correct Firebase project, domain, security headers, cache rules, and SPA-free static routing.
2. Set reviewed public build variables and build from the committed lockfile.
3. Run `npm run check` and `npm run build` in `apps/web/`.
4. Deploy `apps/web/dist/` to an access-restricted preview environment and verify deep links, assets, and contact actions.
5. Promote only after integrated release checks and launch approval.

## Backend Release

Once `apps/api/` exists: build/test a container, bind `0.0.0.0:$PORT`, push an immutable image to Artifact Registry, and deploy a Cloud Run revision with a dedicated service account. Configure Secret Manager, App Check verification, Firestore access, quota settings, and restricted origins before enabling paid inference.

Start with request-based billing and zero minimum instances; measure cold starts. Maximum instances and timeout are bounded starting settings, not a guarantee of a hard dollar cap. [Cloud Run billing](https://docs.cloud.google.com/run/docs/configuring/billing-settings), [maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances)

## Verification and Rollback

Check public page health, API health, session bootstrap, grounding, invalid action rejection, daily limits, voice fallback, and keyboard/touch behavior. Confirm managed logs meet privacy configuration.

Retain a known-good Hosting release and Cloud Run revision. Roll back both together if their content/API versions differ. Disable AI/voice independently during incidents so the publication remains available. Do not use database deletion or billing-account removal as routine rollback.

Source repository visibility is already public; the website launch remains gated until the complete experience is polished.
