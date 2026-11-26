from __future__ import annotations

from typing import Any, Optional

from supabase import AsyncClient, acreate_client

from app.core.config import settings


async def get_supabase_client() -> AsyncClient:
    """Create a Supabase async client using the service-role (secret) key."""
    return await acreate_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)


class ProjectRepository:
    """Data-access layer for projects, pages, and design documents."""

    def __init__(self, supabase: AsyncClient) -> None:
        self.supabase = supabase

    # ------------------------------------------------------------------
    # Projects
    # ------------------------------------------------------------------

    async def get_projects(self, user_id: str) -> list[dict]:
        """Return all non-deleted projects owned by *user_id*."""
        response = (
            await self.supabase.table("projects")
            .select("*")
            .eq("owner_id", user_id)
            .is_("deleted_at", "null")
            .order("updated_at", desc=True)
            .execute()
        )
        return response.data or []

    async def get_project(
        self, project_id: str, user_id: str
    ) -> Optional[dict]:
        """Return a single project if it belongs to *user_id*."""
        response = (
            await self.supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
        return response.data

    async def create_project(self, data: dict, user_id: str) -> dict:
        """Insert a new project row."""
        payload = {**data, "owner_id": user_id}
        response = (
            await self.supabase.table("projects").insert(payload).execute()
        )
        return response.data[0]

    async def update_project(
        self, project_id: str, data: dict, user_id: str
    ) -> dict:
        """Update project fields (ownership-verified)."""
        response = (
            await self.supabase.table("projects")
            .update(data)
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .execute()
        )
        return response.data[0]

    async def delete_project(
        self, project_id: str, user_id: str
    ) -> bool:
        """Soft-delete by setting *deleted_at* to now()."""
        from datetime import datetime, timezone

        response = (
            await self.supabase.table("projects")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .execute()
        )
        return bool(response.data)

    async def restore_project(
        self, project_id: str, user_id: str
    ) -> dict:
        """Clear *deleted_at* to restore the project from trash."""
        response = (
            await self.supabase.table("projects")
            .update({"deleted_at": None})
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .execute()
        )
        return response.data[0]

    # ------------------------------------------------------------------
    # Pages
    # ------------------------------------------------------------------

    async def get_pages(
        self, project_id: str, user_id: str
    ) -> list[dict]:
        """Return all pages for a project (after verifying project ownership)."""
        # Verify ownership first
        project = await self.get_project(project_id, user_id)
        if project is None:
            return []

        response = (
            await self.supabase.table("pages")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at")
            .execute()
        )
        return response.data or []

    # ------------------------------------------------------------------
    # Design document / revisions
    # ------------------------------------------------------------------

    async def get_latest_document(
        self, project_id: str, user_id: str
    ) -> Optional[dict]:
        """Return the most recent revision's *document* JSON."""
        # Verify ownership
        project = await self.get_project(project_id, user_id)
        if project is None:
            return None

        response = (
            await self.supabase.table("project_revisions")
            .select("*")
            .eq("project_id", project_id)
            .order("version", desc=True)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    async def save_document(
        self, project_id: str, document: dict, user_id: str
    ) -> dict:
        """
        Persist a new revision.

        Auto-increments *version* by querying the current max.
        Also updates *projects.updated_at* to surface the project in recents.
        """
        from datetime import datetime, timezone

        # Verify ownership
        await self.get_project(project_id, user_id)

        # Determine next version number
        version_response = (
            await self.supabase.table("project_revisions")
            .select("version")
            .eq("project_id", project_id)
            .order("version", desc=True)
            .limit(1)
            .execute()
        )
        rows = version_response.data or []
        next_version = (rows[0]["version"] + 1) if rows else 1

        # Build a lightweight snapshot summary
        pages = document.get("pages", [])
        snapshot_summary: dict[str, Any] = {
            "page_count": len(pages),
            "total_elements": sum(
                len(p.get("artboards", [])) for p in pages
            ),
        }

        revision = {
            "project_id": project_id,
            "version": next_version,
            "document": document,
            "snapshot_summary": snapshot_summary,
            "created_by": user_id,
        }
        response = (
            await self.supabase.table("project_revisions")
            .insert(revision)
            .execute()
        )

        # Bump project updated_at
        await self.supabase.table("projects").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", project_id).execute()

        return response.data[0]

    async def get_revisions(
        self, project_id: str, user_id: str, limit: int = 10
    ) -> list[dict]:
        """Return the *limit* most-recent revisions (without full document blobs)."""
        # Verify ownership
        project = await self.get_project(project_id, user_id)
        if project is None:
            return []

        response = (
            await self.supabase.table("project_revisions")
            .select("id, project_id, version, created_at, snapshot_summary")
            .eq("project_id", project_id)
            .order("version", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
