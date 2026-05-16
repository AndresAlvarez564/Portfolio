import json
import os

import boto3
import pytest
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.skills import create_skill, delete_skill, list_skills, list_skills_admin, update_skill


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
            {"AttributeName": "gsi1pk", "AttributeType": "S"},
            {"AttributeName": "gsi1sk", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "gsi1",
                "KeySchema": [
                    {"AttributeName": "gsi1pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi1sk", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        BillingMode="PAY_PER_REQUEST",
    )


def _skill(skill_id, name, category="backend", visibility="visible", order=0):
    return {
        "pk": f"SKILL#{skill_id}",
        "sk": "METADATA",
        "entityType": "SKILL",
        "skillId": skill_id,
        "name": name,
        "category": category,
        "visibility": visibility,
        "order": order,
        "createdAt": "2026-05-01T00:00:00Z",
        "updatedAt": "2026-05-01T00:00:00Z",
        "gsi1pk": "SKILL",
        "gsi1sk": f"VISIBILITY#{visibility}#{category}",
    }


def _seed(table, item):
    table.put_item(Item=item)


def _valid_body(**overrides):
    body = {
        "name": "Python",
        "category": "backend",
        "visibility": "visible",
        "order": 1,
    }
    body.update(overrides)
    return body


def _admin_event(body=None, path="/skills", method="POST"):
    return {
        "httpMethod": method,
        "path": path,
        "requestContext": {"authorizer": {"claims": {"cognito:groups": "admin"}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _public_event(body=None, path="/skills", method="POST"):
    return {
        "httpMethod": method,
        "path": path,
        "requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _body(response):
    return json.loads(response["body"])


@mock_aws
def test_list_skills_returns_visible_only():
    table = _make_table()
    _seed(table, _skill("visible", "Python", visibility="visible"))
    _seed(table, _skill("hidden", "Terraform", visibility="hidden"))

    response = list_skills({})
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert [item["skillId"] for item in data] == ["visible"]


@mock_aws
def test_list_skills_admin_returns_all():
    table = _make_table()
    _seed(table, _skill("visible", "Python", visibility="visible"))
    _seed(table, _skill("hidden", "Terraform", visibility="hidden"))

    response = list_skills_admin(_admin_event(method="GET", path="/skills/admin"))
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert {item["skillId"] for item in data} == {"visible", "hidden"}


@mock_aws
def test_create_skill_success_returns_201():
    _make_table()

    response = create_skill(_admin_event(_valid_body(name="React", category="frontend")))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["name"] == "React"
    assert data["category"] == "frontend"
    assert data["visibility"] == "visible"


@mock_aws
def test_create_skill_invalid_category_returns_400():
    _make_table()

    response = create_skill(_admin_event(_valid_body(category="security")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_create_skill_without_admin_returns_403():
    _make_table()

    with pytest.raises(PermissionError):
        create_skill(_public_event(_valid_body()))


@mock_aws
def test_update_skill_visibility_updates_gsi_key():
    table = _make_table()
    _seed(table, _skill("one", "Python", visibility="visible"))

    response = update_skill(
        _admin_event(_valid_body(name="Python", visibility="hidden"), path="/skills/one", method="PUT"),
        "one",
    )
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["visibility"] == "hidden"

    item = table.get_item(Key={"pk": "SKILL#one", "sk": "METADATA"})["Item"]
    assert item["gsi1sk"] == "VISIBILITY#hidden#backend"


@mock_aws
def test_delete_skill_success_returns_204():
    table = _make_table()
    _seed(table, _skill("one", "Python"))

    response = delete_skill(_admin_event(path="/skills/one", method="DELETE"), "one")

    assert response["statusCode"] == 204
