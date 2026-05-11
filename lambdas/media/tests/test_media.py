# test_media.py — unit tests for the media domain
# Run with: pytest

import pytest
from routes.media import list_media, request_upload_url, confirm_upload, delete_media


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_list_media_requires_admin_group():
    with pytest.raises(PermissionError):
        list_media(_public_event())


def test_request_upload_url_requires_admin_group():
    with pytest.raises(PermissionError):
        request_upload_url(_public_event())


def test_confirm_upload_requires_admin_group():
    with pytest.raises(PermissionError):
        confirm_upload(_public_event())


def test_delete_media_requires_admin_group():
    with pytest.raises(PermissionError):
        delete_media(_public_event(), "some-id")
