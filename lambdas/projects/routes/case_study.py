# case_study.py — route handlers for case study operations
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def get_case_study(event, project_id):
    """GET /projects/{id}/case-study — public. Returns case study for a project."""
    # TODO: implement — GetItem pk=PROJECT#<id> sk=CASE_STUDY
    return success({})


def upsert_case_study(event, project_id):
    """PUT /projects/{id}/case-study — admin only. Creates or updates a case study."""
    require_group(event, "admin")
    # TODO: implement — validate body, PutItem pk=PROJECT#<id> sk=CASE_STUDY
    return success({})
