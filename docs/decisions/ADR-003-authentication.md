# ADR-003: Visitor Access and API Protection

Status: proposed implementation design; not implemented. Date: 2026-09-28.

## Context

Recruiters and collaborators should browse and use the guide without creating an account. Paid inference still needs abuse protection, request attribution for quotas, and origin validation. Anonymous sessions must not be described as verified personal identities.

## Decision

Public publication pages require no authentication. Protect API calls with Firebase App Check plus a server-issued signed, short-lived anonymous session cookie. Prefer same-origin Hosting rewrites so the cookie can be `Secure`, `HttpOnly`, and `SameSite=Lax`; verify mutation origins. Combine session quotas with rotating HMAC network buckets and global limits.

App Check attests a client application; it does not authenticate a human or eliminate abuse. A session provides continuity, not an account identity. Clearing cookies can reset session identity, so it cannot be the only limit. Obtain network addresses only from a verified platform path; never trust arbitrary forwarded headers.

## Alternatives

Mandatory Google/GitHub login adds visitor friction. Firebase anonymous Auth could issue identity tokens but adds an identity service that is not required by this initial custom API design. Client-only counters, origin/CORS checks, and local storage cannot enforce paid usage limits.

## Consequences

Session bootstrap itself needs inexpensive rate limits. Attestation failures require useful retry/fallback UI. Network limits can affect shared connections and are imperfect against distributed abuse. Never persist raw IPs; disclose short-lived pseudonymous enforcement and verify managed-service log behavior separately.

If future features require saved personal state, account ownership, or administrative login, add actual user authentication through a new ADR.

Reference: [Protect custom backends with App Check](https://firebase.google.com/docs/app-check/web/custom-resource), [backend verification](https://firebase.google.com/docs/app-check/custom-resource-backend).
