# certifications.py — route handlers for the certifications domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def list_certifications(event):
    """GET /certifications — public. Returns all certifications sorted by issue date."""
    # TODO: implement — query GSI-1 gsi1pk=CERTIFICATION sort by gsi1sk desc
    return success([])


def create_certification(event):
    """POST /certifications — admin only. Creates a new certification."""
    require_group(event, "admin")
    # TODO: implement — validate body, generate certificationId, PutItem
    return success({}, status_code=201)


def update_certification(event, certification_id):
    """PUT /certifications/{id} — admin only. Updates a certification."""
    require_group(event, "admin")
    # TODO: implement — validate body, UpdateItem pk=CERTIFICATION#<id> sk=METADATA
    return success({})


def delete_certification(event, certification_id):
    """DELETE /certifications/{id} — admin only. Deletes a certification."""
    require_group(event, "admin")
    # TODO: implement — DeleteItem pk=CERTIFICATION#<id> sk=METADATA
    return success(None, status_code=204)
