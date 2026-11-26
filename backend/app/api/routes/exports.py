from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import PlainTextResponse

from app.core.security import get_current_user
from app.repositories.project_repository import (
    ProjectRepository,
    get_supabase_client,
)
from app.schemas.export import ExportFormat, ExportJobResponse, ExportRequest, ExportStatus
from app.services import export_service

router = APIRouter(prefix="/exports", tags=["exports"])

# ---------------------------------------------------------------------------
# In-memory job store (replace with DB / Redis in production)
# ---------------------------------------------------------------------------
_job_store: dict[str, dict] = {}


def _make_job(format: ExportFormat) -> dict:
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    job = {
        "job_id": job_id,
        "status": ExportStatus.pending,
        "format": format,
        "download_url": None,
        "created_at": now,
        "expires_at": now + timedelta(hours=1),
        "content": None,
    }
    _job_store[job_id] = job
    return job


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/generate")
async def generate_export(
    body: ExportRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate an export from a saved project document.

    - Prompt formats (txt / md): synchronous — returns text immediately.
    - HTML / React: synchronous for now — returns text/plain with the code.
    - Image formats (png / svg): not supported server-side without a headless
      browser; returns 501 with guidance to use the client-side exporter.
    """
    user_id: str = current_user["sub"]

    # Fetch the latest document from the project
    client = await get_supabase_client()
    repo = ProjectRepository(client)
    revision = await repo.get_latest_document(body.project_id, user_id)
    if revision is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document found for this project",
        )
    document: dict = revision.get("document", {})

    # ---- Prompt text -------------------------------------------------------
    if body.format == ExportFormat.prompt_txt:
        content = await export_service.generate_prompt_txt(document)
        return PlainTextResponse(content=content, media_type="text/plain")

    if body.format == ExportFormat.prompt_md:
        content = await export_service.generate_prompt_md(document)
        return PlainTextResponse(content=content, media_type="text/markdown")

    # ---- HTML / React ------------------------------------------------------
    if body.format == ExportFormat.html:
        content = await export_service.generate_html(document)
        return PlainTextResponse(content=content, media_type="text/html")

    if body.format == ExportFormat.react:
        content = await export_service.generate_react(document)
        return PlainTextResponse(content=content, media_type="text/plain")

    # ---- Image formats (not supported server-side) -------------------------
    if body.format in (ExportFormat.png, ExportFormat.svg):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                f"{body.format.value.upper()} export requires a headless browser and is not "
                "supported server-side. Use the client-side export feature in the Scafbind editor."
            ),
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown export format: {body.format}",
    )


@router.get("/jobs/{job_id}", response_model=ExportJobResponse)
async def get_export_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Check the status of an async export job."""
    job = _job_store.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )
    return ExportJobResponse(**{k: v for k, v in job.items() if k != "content"})


@router.get("/download/{job_id}")
async def download_export(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download a completed export job."""
    job = _job_store.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )
    if job["status"] != ExportStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Export is not ready yet. Current status: {job['status']}",
        )
    content = job.get("content", "")
    fmt: ExportFormat = job["format"]

    media_types = {
        ExportFormat.prompt_txt: "text/plain",
        ExportFormat.prompt_md: "text/markdown",
        ExportFormat.html: "text/html",
        ExportFormat.react: "text/plain",
        ExportFormat.png: "image/png",
        ExportFormat.svg: "image/svg+xml",
    }
    return PlainTextResponse(
        content=content,
        media_type=media_types.get(fmt, "application/octet-stream"),
    )
