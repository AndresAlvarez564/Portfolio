# test_experience.py — unit tests for the experience domain
# Run with: pytest

import pytest
from routes.experience import (
    list_experience,
    create_experience,
    update_experience,
    delete_experience,
    reorder_experience,
)


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_list_experience_returns_200():
    response = list_experience({})
    assert response["statusCode"] == 200


def test_create_experience_requires_admin_group():
    with pytest.raises(PermissionError):
        create_experience(_public_event())


def test_update_experience_requires_admin_group():
    with pytest.raises(PermissionError):
        update_experience(_public_event(), "some-id")


def test_delete_experience_requires_admin_group():
    with pytest.raises(PermissionError):
        delete_experience(_public_event(), "some-id")


def test_reorder_experience_requires_admin_group():
    with pytest.raises(PermissionError):
        reorder_experience(_public_event())
