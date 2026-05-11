# test_certifications.py — unit tests for the certifications domain
# Run with: pytest

import pytest
from routes.certifications import (
    list_certifications,
    create_certification,
    update_certification,
    delete_certification,
)


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_list_certifications_returns_200():
    response = list_certifications({})
    assert response["statusCode"] == 200


def test_create_certification_requires_admin_group():
    with pytest.raises(PermissionError):
        create_certification(_public_event())


def test_update_certification_requires_admin_group():
    with pytest.raises(PermissionError):
        update_certification(_public_event(), "some-id")


def test_delete_certification_requires_admin_group():
    with pytest.raises(PermissionError):
        delete_certification(_public_event(), "some-id")
