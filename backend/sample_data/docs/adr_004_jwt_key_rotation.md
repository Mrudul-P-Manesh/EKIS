# ADR-004: Automated JWT Key Rotation and Invalidation Policy

## Status
Accepted

## Context
Previously, the platform utilized a static RSA-256 key pair defined via `JWT_SECRET_KEY` in environment variables. Rotating keys required manual secrets deployment and synchronized rolling restarts of all downstream services. To improve zero-trust compliance, automated 30-day asymmetric key rotation was adopted.

## Decision
1. **Key Generation**: `auth-service` will generate a new RSA-2048 key pair every 30 days (`KEY_ROTATION_INTERVAL=30d`).
2. **Key Identifier (kid)**: All issued tokens must include the `kid` header parameter corresponding to the active key.
3. **Dual Key Grace Period**: During rotation, the previous key remains valid for token verification for a 48-hour grace period, but is no longer used for signing new tokens.
4. **Public Key Discovery**: Public keys are published at `http://auth-service/api/v1/auth/jwks.json`.

## Consequences & Operational Risks
- **Downstream Key Caching**: Downstream consumers (including `api-gateway` and `user-service`) must poll `/api/v1/auth/jwks.json` or invalidate their local key cache when encountering an unknown `kid`.
- **Known Failure Mode**: If downstream services cache keys statically with a 24-hour TTL and ignore unknown `kid` headers, any token signed by the newly rotated key will fail signature verification, causing wide-scale `401 Unauthorized` errors until the cache expires or is manually flushed.
