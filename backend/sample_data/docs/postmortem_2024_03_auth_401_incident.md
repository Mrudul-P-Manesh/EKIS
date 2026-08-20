# Postmortem: Incident INC-401 - Authentication 401 Spikes Post-Deployment

## Incident Summary
- **Date**: 2024-03-14 14:22 UTC
- **Severity**: SEV-1 (Critical Outage)
- **Impact**: 68% of authenticated API requests rejected with HTTP 401 Unauthorized across web and mobile clients.
- **Duration**: 42 minutes.

## Root Cause
Following the deployment of `auth-service` v2.4.0, an automated key rotation event triggered pursuant to ADR-004. A new RSA key pair (`kid: key-2024-03-14`) was generated and immediately used to sign incoming user login tokens. 

However, `api-gateway` and `auth_middleware.py` had a static 24-hour in-memory cache TTL for public keys. Because the JWKS cache did not implement dynamic fallback fetching when an unrecognized `kid` was received, downstream services attempted to verify new tokens against the old cached public key (`kid: key-2024-02-12`). This resulted in signature verification failures and widespread `401 Unauthorized` errors.

## Resolution & Recovery
1. On-call engineers issued a cache flush command via `POST /admin/cache/refresh` to the API gateway and worker pods.
2. An emergency hotfix was rolled out to `auth_middleware.py` ensuring that whenever an unrecognized `kid` is encountered, the middleware immediately fetches the latest JWKS before rejecting the request.

## Action Items & Preventative Measures
- [x] Implement on-demand JWKS key cache eviction on unknown `kid` in `token_verifier.py`.
- [x] Configure webhook notifications from `auth-service` to broadcast key rotation events.
- [x] Add automated end-to-end integration test verifying key rotation without 401 errors.
