import json
import os

import boto3
import pytest
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.contact import list_messages, submit_contact, update_message_status


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


def _make_queue():
    sqs = boto3.client("sqs", region_name="us-east-1")
    queue_url = sqs.create_queue(QueueName="contact")["QueueUrl"]
    os.environ["CONTACT_QUEUE_URL"] = queue_url
    return queue_url


def _message(message_id, status="unread", created_at="2026-05-01T00:00:00Z"):
    return {
        "pk": f"CONTACT#{message_id}",
        "sk": "MESSAGE",
        "entityType": "CONTACT_MESSAGE",
        "messageId": message_id,
        "name": "Andre",
        "email": "andre@example.com",
        "company": "Acme",
        "projectType": "Web app",
        "budget": "$5k",
        "subject": "Project",
        "message": "Let's build something.",
        "status": status,
        "createdAt": created_at,
        "updatedAt": created_at,
        "gsi1pk": "CONTACT",
        "gsi1sk": f"CREATED#{created_at}#STATUS#{status}#MESSAGE#{message_id}",
    }


def _seed(table, item):
    table.put_item(Item=item)


def _valid_body(**overrides):
    body = {
        "name": "Andre",
        "email": "andre@example.com",
        "company": "Acme",
        "projectType": "Web app",
        "budget": "$5k",
        "subject": "Project inquiry",
        "message": "I want to build a portfolio project.",
        "website": "",
    }
    body.update(overrides)
    return body


def _admin_event(body=None, status=None, path="/contact", method="GET"):
    query = {"status": status} if status else None
    return {
        "httpMethod": method,
        "path": path,
        "queryStringParameters": query,
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
def test_submit_contact_success_returns_200():
    _make_table()
    _make_queue()

    response = submit_contact(_public_event(_valid_body()))
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["message"] == "Your message has been sent."


@mock_aws
def test_submit_contact_honeypot_triggered_returns_200_silently():
    _make_table()
    _make_queue()

    response = submit_contact(_public_event(_valid_body(website="bot-site")))

    assert response["statusCode"] == 200
    assert _body(response)["data"]["message"] == "Your message has been sent."


@mock_aws
def test_submit_contact_missing_name_returns_400():
    _make_table()

    response = submit_contact(_public_event(_valid_body(name="")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_submit_contact_invalid_email_returns_400():
    _make_table()

    response = submit_contact(_public_event(_valid_body(email="not-an-email")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_submit_contact_message_too_long_returns_400():
    _make_table()

    response = submit_contact(_public_event(_valid_body(message="x" * 2001)))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_list_messages_without_admin_returns_403():
    _make_table()

    with pytest.raises(PermissionError):
        list_messages(_public_event())


@mock_aws
def test_list_messages_filter_by_status():
    table = _make_table()
    _seed(table, _message("one", status="unread"))
    _seed(table, _message("two", status="read", created_at="2026-05-02T00:00:00Z"))

    response = list_messages(_admin_event(status="read"))
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert [item["messageId"] for item in data] == ["two"]


@mock_aws
def test_update_message_status_updates_gsi_key():
    table = _make_table()
    _seed(table, _message("one", status="unread"))

    response = update_message_status(
        _admin_event({"status": "archived"}, path="/contact/one", method="PATCH"),
        "one",
    )
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["status"] == "archived"

    item = table.get_item(Key={"pk": "CONTACT#one", "sk": "MESSAGE"})["Item"]
    assert item["gsi1sk"] == "CREATED#2026-05-01T00:00:00Z#STATUS#archived#MESSAGE#one"


@mock_aws
def test_update_message_invalid_status_returns_400():
    table = _make_table()
    _seed(table, _message("one", status="unread"))

    response = update_message_status(
        _admin_event({"status": "deleted"}, path="/contact/one", method="PATCH"),
        "one",
    )

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"
