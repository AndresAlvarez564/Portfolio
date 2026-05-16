import json
import os

import boto3
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from handler import lambda_handler
from routes.certifications import (
    create_certification,
    delete_certification,
    list_certifications,
    update_certification,
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


def _certification(certification_id, name, issue_date):
    return {
        "pk": f"CERTIFICATION#{certification_id}",
        "sk": "METADATA",
        "entityType": "CERTIFICATION",
        "certificationId": certification_id,
        "name": name,
        "issuer": "AWS",
        "issueDate": issue_date,
        "expirationDate": "",
        "verificationUrl": "https://example.com/verify",
        "badgeUrl": "https://cdn.example.com/badge.png",
        "badgeS3Key": "certifications/badge.png",
        "createdAt": "2026-05-01T00:00:00Z",
        "updatedAt": "2026-05-01T00:00:00Z",
        "gsi1pk": "CERTIFICATION",
        "gsi1sk": f"ISSUE_DATE#{issue_date}#CERTIFICATION#{certification_id}",
    }


def _seed(table, item):
    table.put_item(Item=item)


def _valid_body(**overrides):
    body = {
        "name": "AWS Certified Developer",
        "issuer": "AWS",
        "issueDate": "2026-04",
        "expirationDate": "2029-04",
        "verificationUrl": "https://example.com/verify",
        "badgeUrl": "https://cdn.example.com/badge.png",
        "badgeS3Key": "certifications/badge.png",
    }
    body.update(overrides)
    return body


def _admin_event(body=None, path="/certifications", method="POST"):
    return {
        "httpMethod": method,
        "path": path,
        "requestContext": {"authorizer": {"claims": {"cognito:groups": "admin"}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _public_event(body=None, path="/certifications", method="POST"):
    return {
        "httpMethod": method,
        "path": path,
        "requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}},
        "body": json.dumps(body) if body is not None else None,
    }


def _body(response):
    return json.loads(response["body"])


@mock_aws
def test_list_certifications_returns_all_sorted_by_date():
    table = _make_table()
    _seed(table, _certification("old", "Older Cert", "2024-01"))
    _seed(table, _certification("new", "Newer Cert", "2026-01"))

    response = list_certifications({})
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert [item["certificationId"] for item in data] == ["new", "old"]


@mock_aws
def test_create_certification_success_returns_201():
    _make_table()

    response = create_certification(_admin_event(_valid_body(name="AWS Architect")))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["name"] == "AWS Architect"
    assert data["issuer"] == "AWS"
    assert data["issueDate"] == "2026-04"


@mock_aws
def test_create_certification_missing_name_returns_400():
    _make_table()

    response = create_certification(_admin_event(_valid_body(name="")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_create_certification_invalid_date_format_returns_400():
    _make_table()

    response = create_certification(_admin_event(_valid_body(issueDate="2026-13")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_create_certification_without_admin_returns_403():
    _make_table()

    response = lambda_handler(_public_event(_valid_body()), None)

    assert response["statusCode"] == 403


@mock_aws
def test_update_certification_success():
    table = _make_table()
    _seed(table, _certification("one", "Old Name", "2024-01"))

    response = update_certification(
        _admin_event(_valid_body(name="New Name", issueDate="2026-05"), path="/certifications/one", method="PUT"),
        "one",
    )
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["name"] == "New Name"

    item = table.get_item(Key={"pk": "CERTIFICATION#one", "sk": "METADATA"})["Item"]
    assert item["gsi1sk"] == "ISSUE_DATE#2026-05#CERTIFICATION#one"


@mock_aws
def test_delete_certification_success_returns_204():
    table = _make_table()
    _seed(table, _certification("one", "Delete Me", "2025-01"))

    response = delete_certification(_admin_event(path="/certifications/one", method="DELETE"), "one")

    assert response["statusCode"] == 204
