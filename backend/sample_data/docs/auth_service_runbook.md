# Operational Runbook: Authentication Service & Gateway Troubleshooting

## Common Alerts & Remediation

### Alert: `AuthService401Spike`
- **Symptom**: Surge in HTTP 401 Unauthorized errors reported by `api-gateway` or microservices.
- **Diagnostic Steps**:
  1. Check `auth-service` logs for recent key rotation timestamp:
     ```bash
     kubectl logs -l app=auth-service --tail=200 | grep "Key rotation completed"
     ```
  2. Inspect the current JWKS endpoint:
     ```bash
     curl -s http://auth-service/api/v1/auth/jwks.json | jq .
     ```
  3. Compare `kid` in token headers against active JWKS keys.
  4. If mismatch is detected due to key cache lag:
     - Execute JWKS cache refresh:
       ```bash
       curl -X POST http://api-gateway:8080/admin/cache/refresh
       ```

### Alert: `TokenTTLClockSkew`
- **Symptom**: Tokens rejected immediately after issuance.
- **Remediation**: Synchronize NTP daemons across cluster nodes. Verify `TOKEN_TTL` in `jwt_config.yaml` is set to at least 900 seconds.
