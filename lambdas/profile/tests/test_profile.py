# test_profile.py — unit tests for the profile domain
# Run with: pytest

import pytest
from routes.profile import get_profile, update_profile


def test_get_profile_returns_200():
    event = {}
    response = get_profile(event)
    assert response["statusCode"] == 200


def test_update_profile_requires_admin_group():
    event = {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}
    with pytest.raises(PermissionError):
        update_profile(event)
