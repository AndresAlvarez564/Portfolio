import json
import os

import boto3
import pytest
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from handler import lambda_handler
from routes.case_study import get_case_study, upsert_case_study


def _make_table():
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    return dynamodb.create_table(
        TableName="portfolio-dev-main",
        KeySchema=[
            {"AttributeName": "pk", "KeyType": "HASH"},
            {"AttributeName": "sk", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )


def _seed_case_study(table, project_id="project-one", problem="Old problem"):
    table.put_item(Item={
        "pk": f"PROJECT#{project_id}",
        "sk": "CASE_STUDY",
        "entityType": "CASE_STUDY",
        "projectId": project_id,
        "problem": problem,
        "solution": "Solution",
        "architecture": "Architecture",
        "challenges": "Challenges",
        "results": "Results",
        "updatedAt": "2026-05-01T00:00:00Z",
    })


def _admin_event(body=None):
    return {
        "requestContext": {"authorizer": {"claims": {"cognito:groups": "admin"}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _public_event(body=None):
    return {
        "requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _body(response):
    return json.loads(response["body"])


def _valid_body(problem="Problem"):
    return {
        "problem": problem,
        "solution": "Solution",
        "architecture": "Architecture",
        "challenges": "Challenges",
        "results": "Results",
    }


@mock_aws
def test_get_case_study_returns_data():
    table = _make_table()
    _seed_case_study(table)

    response = get_case_study({}, "project-one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["problem"] == "Old problem"
    assert data["projectId"] == "project-one"
    assert "pk" not in data


@mock_aws
def test_get_case_study_not_found_returns_empty():
    _make_table()

    response = get_case_study({}, "missing")

    assert response["statusCode"] == 200
    assert _body(response)["data"] == {}


@mock_aws
def test_upsert_case_study_creates_new():
    _make_table()

    response = upsert_case_study(_admin_event(_valid_body()), "project-one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["problem"] == "Problem"
    assert data["projectId"] == "project-one"


@mock_aws
def test_upsert_case_study_replaces_existing():
    table = _make_table()
    _seed_case_study(table)

    response = upsert_case_study(_admin_event(_valid_body("New problem")), "project-one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["problem"] == "New problem"

    item = table.get_item(Key={"pk": "PROJECT#project-one", "sk": "CASE_STUDY"})["Item"]
    assert item["problem"] == "New problem"


@mock_aws
def test_upsert_case_study_missing_required_field_returns_400():
    _make_table()

    response = upsert_case_study(_admin_event({"problem": "Problem"}), "project-one")

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_upsert_case_study_without_admin_returns_403():
    _make_table()

    response = lambda_handler({
        **_public_event(_valid_body()),
        "httpMethod": "PUT",
        "path": "/projects/project-one/case-study",
    }, None)

    assert response["statusCode"] == 403
    assert _body(response)["error"]["code"] == "FORBIDDEN"


def test_upsert_case_study_route_requires_admin_group():
    with pytest.raises(PermissionError):
        upsert_case_study(_public_event(_valid_body()), "project-one")
