import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("auth_middleware")


class AuthMiddleware:
    """
    API Gateway authentication middleware.
    Validates JWT bearer tokens against public JWKS keys.
    """

    def __init__(self, jwks_url: str = "http://auth-service/api/v1/auth/jwks.json"):
        self.jwks_url = jwks_url
        self.key_cache: Dict[str, Any] = {}
        self.cache_last_updated = 0
        self.cache_ttl = 86400  # 24 hours (Stale cache vulnerability)

    def verify_token(self, token_header: Dict[str, Any], token_payload: Dict[str, Any]) -> bool:
        kid = token_header.get("kid")
        if not kid:
            logger.error("Token missing 'kid' header, rejecting with 401.")
            return False

        # Check in-memory key cache
        public_key = self.key_cache.get(kid)
        if not public_key:
            # Vulnerability: Stale cache without instant on-demand fetch
            logger.warning(f"Key ID {kid} not in local cache (TTL {self.cache_ttl}s). Signature verification failed -> 401 Unauthorized.")
            return False

        # Check expiration
        if token_payload.get("exp", 0) < time.time():
            logger.warning("Token expired (ERR_JWT_EXPIRED).")
            return False

        return True

    def refresh_cache_manually(self):
        """Admin endpoint trigger for cache invalidation."""
        self.key_cache.clear()
        self.cache_last_updated = time.time()
        logger.info("AuthMiddleware key cache successfully flushed and refreshed.")
