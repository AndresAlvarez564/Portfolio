# test_contact.py — unit tests for the contact domain
# Run with: pytest

import pytest
from routes.contact import submit_contact, list_messages, get_message, update_message_status


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_submit_contact_returns_200():
    response = submit_contact({})
    assert response["statusCode"] == 200


def test_list_messages_requires_admin_group():
    with pytest.raises(PermissionError):
        list_messages(_public_event())


def test_get_message_requires_admin_group():
    with pytest.raises(PermissionError):
        get_message(_public_event(), "some-id")


def test_update_message_status_requires_admin_group():
    with pytest.raises(PermissionError):
        update_message_status(_public_event(), "some-id")
