# skills.py — route handlers for the skills domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def list_skills(event):
    """GET /skills — public. Returns visible skills only."""
    # TODO: implement — query GSI-1 gsi1pk=SKILL gsi1sk begins_with VISIBILITY#visible
    return success([])


def create_skill(event):
    """POST /skills — admin only. Creates a new skill."""
    require_group(event, "admin")
    # TODO: implement — validate body, generate skillId, PutItem
    return success({}, status_code=201)


def update_skill(event, skill_id):
    """PUT /skills/{id} — admin only. Updates a skill."""
    require_group(event, "admin")
    # TODO: implement — validate body, UpdateItem pk=SKILL#<id> sk=METADATA
    return success({})


def delete_skill(event, skill_id):
    """DELETE /skills/{id} — admin only. Deletes a skill."""
    require_group(event, "admin")
    # TODO: implement — DeleteItem pk=SKILL#<id> sk=METADATA
    return success(None, status_code=204)
