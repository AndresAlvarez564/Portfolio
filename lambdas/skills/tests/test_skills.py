# test_skills.py — unit tests for the skills domain
# Run with: pytest

import pytest
from routes.skills import list_skills, create_skill, update_skill, delete_skill


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_list_skills_returns_200():
    response = list_skills({})
    assert response["statusCode"] == 200


def test_create_skill_requires_admin_group():
    with pytest.raises(PermissionError):
        create_skill(_public_event())


def test_update_skill_requires_admin_group():
    with pytest.raises(PermissionError):
        update_skill(_public_event(), "some-id")


def test_delete_skill_requires_admin_group():
    with pytest.raises(PermissionError):
        delete_skill(_public_event(), "some-id")
