import json
import os
import pytest
import boto3
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.profile import get_profile, update_profile

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_table():
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    table = dynamodb.create_table(
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
    return table


def _seed_profile(table):
    table.put_item(Item={
        "pk": "PROFILE",
        "sk": "SETTINGS",
        "entityType": "PROFILE_SETTINGS",
        "name": "Andres Alvarez",
        "title": "Solutions Architect",
        "summary": "Cloud professional.",
        "location": "Bolivia",
        "email": "andres@example.com",
        "cvS3Key": "media/cv/andres.pdf",
        "cvFileUrl": "https://cdn.example.com/cv.pdf",
        "socialLinks": {"github": "https://github.com/andres", "twitter": ""},
        "updatedAt": "2026-01-01T00:00:00Z",
    })


def _admin_event(body=None):
    return {
        "requestContext": {"authorizer": {"claims": {"cognito:groups": "admin"}}},
        "body": json.dumps(body) if body else None,
    }


def _public_event():
    return {}


# ---------------------------------------------------------------------------
# GET /profile
# ---------------------------------------------------------------------------

@mock_aws
def test_get_profile_returns_sanitized_fields():
    table = _make_table()
    _seed_profile(table)

    response = get_profile(_public_event())
    assert response["statusCode"] == 200
    data = json.loads(response["body"])["data"]

    # Private fields must not be present
    assert "email" not in data
    assert "cvS3Key" not in data

    # Public fields must be present
    assert data["name"] == "Andres Alvarez"
    assert data["title"] == "Solutions Architect"
    assert data["cvFileUrl"] == "https://cdn.example.com/cv.pdf"


@mock_aws
def test_get_profile_removes_empty_social_links():
    table = _make_table()
    _seed_profile(table)

    response = get_profile(_public_event())
    data = json.loads(response["body"])["data"]

    # twitter is empty string — should be removed
    assert "twitter" not in data["socialLinks"]
    assert data["socialLinks"]["github"] == "https://github.com/andres"


@mock_aws
def test_get_profile_not_found_returns_404():
    _make_table()  # empty table, no profile seeded

    response = get_profile(_public_event())
    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert body["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# PUT /profile
# ---------------------------------------------------------------------------

@mock_aws
def test_update_profile_success():
    table = _make_table()
    _seed_profile(table)

    event = _admin_event({
        "name": "Andres Updated",
        "title": "Senior Architect",
        "summary": "Updated summary.",
        "location": "La Paz",
        "socialLinks": {"github": "https://github.com/andres2"},
    })

    response = update_profile(event)
    assert response["statusCode"] == 200
    data = json.loads(response["body"])["data"]
    assert data["name"] == "Andres Updated"
    assert data["title"] == "Senior Architect"
    assert "email" not in data


@mock_aws
def test_update_profile_missing_required_field_returns_400():
    _make_table()

    event = _admin_event({
        "name": "Andres",
        # missing title, summary, location
    })

    response = update_profile(event)
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_update_profile_field_too_long_returns_400():
    _make_table()

    event = _admin_event({
        "name": "A" * 101,  # max is 100
        "title": "Architect",
        "summary": "Summary.",
        "location": "Bolivia",
    })

    response = update_profile(event)
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_update_profile_without_admin_group_returns_403():
    event = {
        "requestContext": {"authorizer": {"claims": {"cognito:groups": ""}}},
        "body": json.dumps({"name": "X", "title": "X", "summary": "X", "location": "X"}),
    }
    with pytest.raises(PermissionError):
        update_profile(event)
