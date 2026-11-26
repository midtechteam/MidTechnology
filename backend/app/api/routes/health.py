from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", status_code=status.HTTP_200_OK)
async def health_check():
    """Basic health check — always fast."""
    return {"status": "ok", "version": "0.1.0", "env": settings.APP_ENV}


@router.get("/detailed", status_code=status.HTTP_200_OK)
async def health_detailed():
    """
    Detailed health check including Supabase connectivity.
    Returns 200 if all dependencies are reachable, 503 otherwise.
    """
    import httpx

    checks: dict[str, str] = {"api": "ok"}

    # Ping Supabase REST endpoint
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{settings.SUPABASE_URL}/rest/v1/")
            checks["supabase"] = "ok" if resp.status_code < 500 else "degraded"
    except Exception as exc:
        checks["supabase"] = f"unreachable ({exc})"

    overall_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=status.HTTP_200_OK if overall_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "ok" if overall_ok else "degraded", "checks": checks, "version": "0.1.0"},
    )
