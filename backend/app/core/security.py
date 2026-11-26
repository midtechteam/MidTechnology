from __future__ import annotations

import time
from typing import Optional

import httpx
from fastapi import Header, HTTPException, Request, status
from jose import JWTError, jwk, jwt

from app.core.config import settings

# ---------------------------------------------------------------------------
# JWKS cache: (keys_dict, fetched_at_epoch)
# ---------------------------------------------------------------------------
_JWKS_CACHE: tuple[dict, float] | None = None
_JWKS_TTL_SECONDS = 300  # 5 minutes


async def _get_jwks() -> dict:
    """Fetch and cache JWKS from Supabase."""
    global _JWKS_CACHE
    now = time.monotonic()
    if _JWKS_CACHE is not None:
        keys, fetched_at = _JWKS_CACHE
        if now - fetched_at < _JWKS_TTL_SECONDS:
            return keys

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.SUPABASE_JWKS_URL, timeout=10)
        response.raise_for_status()
        keys = response.json()

    _JWKS_CACHE = (keys, now)
    return keys


async def verify_supabase_token(token: str) -> dict:
    """
    Validate a Supabase-issued JWT.

    Returns the decoded payload on success; raises HTTPException 401 on failure.
    """
    try:
        jwks = await _get_jwks()

        # Decode header to find the matching key
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find the matching public key in the JWKS
        public_key = None
        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                public_key = jwk.construct(key_data)
                break

        if public_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find matching public key",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False},  # Supabase JWTs may omit standard aud
        )
        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch JWKS: {exc}",
        ) from exc


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> dict:
    """
    FastAPI dependency that extracts and validates the Bearer token.

    Returns the decoded JWT payload (sub = user ID, email, etc.).
    Raises HTTPException 401 if the token is missing or invalid.
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await verify_supabase_token(token)


async def get_optional_user(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> Optional[dict]:
    """
    Like get_current_user but returns None instead of raising when no token is provided.
    Still raises 401 if a malformed or invalid token is supplied.
    """
    if authorization is None:
        return None
    return await get_current_user(request, authorization)
