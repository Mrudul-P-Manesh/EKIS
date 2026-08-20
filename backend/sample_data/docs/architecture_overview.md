# System Architecture & Service Topology

## Overview
The Engineering Knowledge Intelligence platform is composed of several federated microservices communicating via HTTP/REST and gRPC, secured by centralized token-based authentication.

```
                  +-------------------+
                  |   API Gateway     |
                  +---------+---------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+         +----------------------+
|  Auth Service         |         |  User Service        |
|  (Token Issuance &    |         |  (User Profile & RBAC|
|   Key Rotation)       |         +----------------------+
+-----------+-----------+                    |
            |                                v
            |                     +----------------------+
            +-------------------> |  Billing Service     |
                                  +----------------------+
```

## Microservices Catalog

### 1. auth-service
- **Purpose**: Issues cryptographically signed JSON Web Tokens (JWT), manages public/private key pairs, and publishes JWKS endpoints.
- **Dependencies**: Redis (session cache), PostgreSQL (credentials store).
- **Key Configurations**:
  - `JWT_SECRET_KEY`: Master signing key secret.
  - `TOKEN_TTL`: Access token expiration (default: 900 seconds / 15 minutes).
  - `KEY_ROTATION_INTERVAL`: Automated key rotation frequency (30 days).

### 2. api-gateway
- **Purpose**: Ingress traffic routing, rate limiting, and coarse authentication validation via auth middleware.
- **Dependencies**: `auth-service` (fetches public keys via `/api/v1/auth/jwks.json`).
- **Cache Strategy**: Caches public verification keys in memory with a default TTL of 86400 seconds (24 hours).

### 3. user-service
- **Purpose**: Manages user profiles, organizational workspaces, and permissions.
- **Dependencies**: `auth-service` for token verification.

## Failure Modes & Known Vulnerabilities
1. **Uncoordinated Key Rotation**: If `auth-service` rotates the active signing key without downstream notification, services caching old public keys will reject new tokens with `HTTP 401 Unauthorized`.
2. **Clock Drift**: A drift exceeding 60 seconds between hosts causes premature token rejection (`ERR_JWT_EXPIRED`).
