from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ExportFormat(str, Enum):
    png = "png"
    svg = "svg"
    html = "html"
    react = "react"
    prompt_txt = "prompt_txt"
    prompt_md = "prompt_md"


class ExportStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class ExportRequest(BaseModel):
    project_id: str
    format: ExportFormat
    artboard_ids: Optional[List[str]] = Field(
        default=None,
        description="Subset of artboard IDs to export. If None, exports all.",
    )
    scale: float = Field(default=1.0, gt=0, le=10)
    include_background: bool = True


class ExportJobResponse(BaseModel):
    job_id: str
    status: ExportStatus
    format: ExportFormat
    download_url: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
