import json
import os

import boto3
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from handler import lambda_handler
from routes.experience import (
    create_experience,
    delete_experience,
    list_experience,
    reorder_experience,
    update_experience,
)


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


def _experience(experience_id, company, order):
    return {
        "pk": f"EXPERIENCE#{experience_id}",
        "sk": "METADATA",
        "entityType": "EXPERIENCE",
        "experienceId": experience_id,
        "company": company,
        "title": "Developer",
        "description": "Built systems.",
        "startDate": "2024-01",
        "endDate": "",
        "current": True,
        "order": order,
        "createdAt": "2026-05-01T00:00:00Z",
        "updatedAt": "2026-05-01T00:00:00Z",
        "gsi1pk": "EXPERIENCE",
        "gsi1sk": f"ORDER#{order:03d}",
    }


def _seed(table, item):
    table.put_item(Item=item)


def _valid_body(company="Company"):
    return {
        "company": company,
        "title": "Solutions Architect",
        "description": "Designed and delivered cloud solutions.",
        "startDate": "2024-01",
        "endDate": "",
        "current": True,
    }


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


@mock_aws
def test_list_experience_returns_sorted_by_order():
    table = _make_table()
    _seed(table, _experience("two", "Second", 2))
    _seed(table, _experience("one", "First", 1))

    response = list_experience({})
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert [item["experienceId"] for item in data] == ["one", "two"]


@mock_aws
def test_create_experience_success_returns_201():
    _make_table()

    response = create_experience(_admin_event(_valid_body("Acme")))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["company"] == "Acme"
    assert data["order"] == 1


@mock_aws
def test_create_experience_missing_company_returns_400():
    _make_table()
    body = _valid_body("")

    response = create_experience(_admin_event(body))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_create_experience_without_admin_returns_403():
    _make_table()

    response = lambda_handler({
        **_public_event(_valid_body()),
        "httpMethod": "POST",
        "path": "/experience",
    }, None)

    assert response["statusCode"] == 403


@mock_aws
def test_update_experience_success():
    table = _make_table()
    _seed(table, _experience("one", "Old", 1))

    response = update_experience(_admin_event(_valid_body("New")), "one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["company"] == "New"


@mock_aws
def test_delete_experience_success_returns_204():
    table = _make_table()
    _seed(table, _experience("one", "Delete", 1))

    response = delete_experience(_admin_event(), "one")

    assert response["statusCode"] == 204


@mock_aws
def test_reorder_experience_updates_order_and_gsi_key():
    table = _make_table()
    _seed(table, _experience("one", "First", 1))
    _seed(table, _experience("two", "Second", 2))

    response = reorder_experience(_admin_event({"orderedIds": ["two", "one"]}))
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert [item["experienceId"] for item in data] == ["two", "one"]

    item = table.get_item(Key={"pk": "EXPERIENCE#two", "sk": "METADATA"})["Item"]
    assert int(item["order"]) == 1
    assert item["gsi1sk"] == "ORDER#001"


@mock_aws
def test_reorder_experience_without_admin_returns_403():
    _make_table()

    response = lambda_handler({
        **_public_event({"orderedIds": ["one"]}),
        "httpMethod": "PATCH",
        "path": "/experience/reorder",
    }, None)

    assert response["statusCode"] == 403
