# experience.py — route handlers for the experience domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def list_experience(event):
    """GET /experience — public. Returns all experience entries ordered by display order."""
    # TODO: implement — query GSI-1 gsi1pk=EXPERIENCE sort by gsi1sk
    return success([])


def create_experience(event):
    """POST /experience — admin only. Creates a new experience entry."""
    require_group(event, "admin")
    # TODO: implement — validate body, generate experienceId, PutItem
    return success({}, status_code=201)


def update_experience(event, experience_id):
    """PUT /experience/{id} — admin only. Updates an experience entry."""
    require_group(event, "admin")
    # TODO: implement — validate body, UpdateItem pk=EXPERIENCE#<id> sk=METADATA
    return success({})


def delete_experience(event, experience_id):
    """DELETE /experience/{id} — admin only. Deletes an experience entry."""
    require_group(event, "admin")
    # TODO: implement — DeleteItem pk=EXPERIENCE#<id> sk=METADATA
    return success(None, status_code=204)


def reorder_experience(event):
    """PATCH /experience/reorder — admin only. Updates display order for multiple entries."""
    require_group(event, "admin")
    # TODO: implement — validate orderedIds, BatchWriteItem to update order + gsi1sk
    return success({})
