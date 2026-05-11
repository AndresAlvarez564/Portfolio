# projects.py — route handlers for the projects domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def list_projects(event):
    """GET /projects — public. Returns published projects only."""
    # TODO: implement — query GSI-1 gsi1pk=PROJECT gsi1sk begins_with STATUS#published
    return success([])


def list_projects_admin(event):
    """GET /projects/admin — admin only. Returns all projects including drafts."""
    require_group(event, "admin")
    # TODO: implement — query GSI-1 gsi1pk=PROJECT
    return success([])


def get_project_by_slug(event, slug):
    """GET /projects/{slug} — public. Returns published project by slug."""
    # TODO: implement — query GSI-3 gsi3pk=SLUG#<slug> gsi3sk=PROJECT, check status=published
    return success({})


def get_project_admin(event, project_id):
    """GET /projects/{id}/admin — admin only. Returns project by ID including drafts."""
    require_group(event, "admin")
    # TODO: implement — GetItem pk=PROJECT#<id> sk=METADATA
    return success({})


def create_project(event):
    """POST /projects — admin only. Creates a new project."""
    require_group(event, "admin")
    # TODO: implement — validate body, generate projectId + slug, PutItem
    return success({}, status_code=201)


def update_project(event, project_id):
    """PUT /projects/{id} — admin only. Updates a project."""
    require_group(event, "admin")
    # TODO: implement — validate body, UpdateItem pk=PROJECT#<id> sk=METADATA
    return success({})


def delete_project(event, project_id):
    """DELETE /projects/{id} — admin only. Deletes a project."""
    require_group(event, "admin")
    # TODO: implement — DeleteItem pk=PROJECT#<id> sk=METADATA
    return success(None, status_code=204)


def patch_project(event, project_id):
    """PATCH /projects/{id} — admin only. Updates status or featured flag."""
    require_group(event, "admin")
    # TODO: implement — UpdateItem with status or featured fields + GSI key updates
    return success({})
