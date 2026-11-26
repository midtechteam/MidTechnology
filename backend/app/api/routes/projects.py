from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import AsyncClient

from app.core.security import get_current_user
from app.repositories.project_repository import (
    ProjectRepository,
    get_supabase_client,
)
from app.schemas.project import (
    DocumentSave,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    RevisionResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


# ---------------------------------------------------------------------------
# Dependency: build a repository per-request
# ---------------------------------------------------------------------------


async def get_repo() -> ProjectRepository:
    client: AsyncClient = await get_supabase_client()
    return ProjectRepository(client)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    search: Optional[str] = Query(default=None, description="Filter by name"),
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """List the authenticated user's projects with optional search/filter."""
    user_id: str = current_user["sub"]
    projects = await repo.get_projects(user_id)

    # In-memory filtering (small datasets); for large datasets push to DB query
    if search:
        projects = [
            p for p in projects if search.lower() in p.get("name", "").lower()
        ]
    if category:
        projects = [p for p in projects if p.get("category") == category]

    # Paginate
    start = (page - 1) * page_size
    return projects[start : start + page_size]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Create a new project."""
    user_id: str = current_user["sub"]
    data = body.model_dump()
    return await repo.create_project(data, user_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Retrieve a single project (ownership-verified)."""
    user_id: str = current_user["sub"]
    project = await repo.get_project(project_id, user_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Update project metadata."""
    user_id: str = current_user["sub"]
    # Verify exists first
    existing = await repo.get_project(project_id, user_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    data = body.model_dump(exclude_none=True)
    return await repo.update_project(project_id, data, user_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Soft-delete a project (moves to trash)."""
    user_id: str = current_user["sub"]
    deleted = await repo.delete_project(project_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.post("/{project_id}/restore", response_model=ProjectResponse)
async def restore_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Restore a soft-deleted project from the trash."""
    user_id: str = current_user["sub"]
    # For restore we query including deleted_at
    client: AsyncClient = await get_supabase_client()
    response = (
        await client.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await repo.restore_project(project_id, user_id)


@router.get("/{project_id}/document")
async def get_document(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Retrieve the latest saved design document for a project."""
    user_id: str = current_user["sub"]
    revision = await repo.get_latest_document(project_id, user_id)
    if revision is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document found for this project",
        )
    return revision


@router.post("/{project_id}/document", response_model=RevisionResponse, status_code=status.HTTP_201_CREATED)
async def save_document(
    project_id: str,
    body: DocumentSave,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Save a design document, creating a new revision."""
    user_id: str = current_user["sub"]
    # Verify project exists
    project = await repo.get_project(project_id, user_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return await repo.save_document(project_id, body.document, user_id)


@router.get("/{project_id}/revisions", response_model=list[RevisionResponse])
async def list_revisions(
    project_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """List recent revisions for a project."""
    user_id: str = current_user["sub"]
    return await repo.get_revisions(project_id, user_id, limit)


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_repo),
):
    """Duplicate an existing project (copies metadata and latest document)."""
    user_id: str = current_user["sub"]
    source = await repo.get_project(project_id, user_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Create the duplicate
    new_data = {
        "name": f"{source['name']} (Copy)",
        "description": source.get("description"),
        "category": source.get("category", "custom"),
        "artboard_preset": source.get("artboard_preset"),
    }
    new_project = await repo.create_project(new_data, user_id)

    # Copy the latest document if one exists
    latest = await repo.get_latest_document(project_id, user_id)
    if latest and latest.get("document"):
        await repo.save_document(new_project["id"], latest["document"], user_id)

    return new_project
