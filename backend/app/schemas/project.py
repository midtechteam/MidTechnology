from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ProjectCategory(str, Enum):
    website = "website"
    mobile = "mobile"
    desktop = "desktop"
    tablet = "tablet"
    dashboard = "dashboard"
    custom = "custom"


# ---------------------------------------------------------------------------
# Project schemas
# ---------------------------------------------------------------------------


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: ProjectCategory = ProjectCategory.custom
    artboard_preset: Optional[str] = Field(default=None, max_length=100)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[ProjectCategory] = None
    thumbnail: Optional[str] = None  # URL or base64


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: ProjectCategory
    thumbnail: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner_id: str
    page_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Page schemas
# ---------------------------------------------------------------------------


class PageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    project_id: str


class PageUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class PageResponse(BaseModel):
    id: str
    name: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    element_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Artboard schemas
# ---------------------------------------------------------------------------


class ArtboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    page_id: str
    preset: Optional[str] = None
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    background_color: str = Field(default="#FFFFFF", max_length=50)


# ---------------------------------------------------------------------------
# Document / Revision schemas
# ---------------------------------------------------------------------------


class DocumentSave(BaseModel):
    """Payload for saving the full ScafbindDocument JSON."""

    document: dict[str, Any] = Field(
        ..., description="Complete ScafbindDocument JSON object"
    )


class RevisionResponse(BaseModel):
    id: str
    project_id: str
    version: int
    created_at: datetime
    snapshot_summary: Optional[dict[str, Any]] = None

    model_config = {"from_attributes": True}
