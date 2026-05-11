# test_projects.py — unit tests for the projects domain
# Run with: pytest

import pytest
from routes.projects import (
    list_projects,
    list_projects_admin,
    create_project,
    update_project,
    delete_project,
    patch_project,
)
from routes.case_study import get_case_study, upsert_case_study


def _admin_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": "admin"}}}}


def _public_event():
    return {"requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}}}


def test_list_projects_returns_200():
    response = list_projects({})
    assert response["statusCode"] == 200


def test_list_projects_admin_requires_admin_group():
    with pytest.raises(PermissionError):
        list_projects_admin(_public_event())


def test_create_project_requires_admin_group():
    with pytest.raises(PermissionError):
        create_project(_public_event())


def test_update_project_requires_admin_group():
    with pytest.raises(PermissionError):
        update_project(_public_event(), "some-id")


def test_delete_project_requires_admin_group():
    with pytest.raises(PermissionError):
        delete_project(_public_event(), "some-id")


def test_patch_project_requires_admin_group():
    with pytest.raises(PermissionError):
        patch_project(_public_event(), "some-id")


def test_get_case_study_requires_admin_group():
    with pytest.raises(PermissionError):
        get_case_study(_public_event(), "some-id")


def test_upsert_case_study_requires_admin_group():
    with pytest.raises(PermissionError):
        upsert_case_study(_public_event(), "some-id")
