# profile.py — route handlers for the profile domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def get_profile(event):
    """GET /profile — public. Returns sanitized profile settings."""
    # TODO: implement — query DynamoDB pk=PROFILE sk=SETTINGS, exclude sensitive fields
    return success({})


def update_profile(event):
    """PUT /profile — admin only. Updates profile settings."""
    require_group(event, "admin")
    # TODO: implement — validate body, update DynamoDB pk=PROFILE sk=SETTINGS
    return success({})
