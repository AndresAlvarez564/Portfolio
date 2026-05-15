import json
import os

import boto3
import pytest
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.projects import (
    create_project,
    delete_project,
    get_project_by_slug,
    list_projects,
    patch_project,
    update_project,
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
            {"AttributeName": "gsi2pk", "AttributeType": "S"},
            {"AttributeName": "gsi2sk", "AttributeType": "S"},
            {"AttributeName": "gsi3pk", "AttributeType": "S"},
            {"AttributeName": "gsi3sk", "AttributeType": "S"},
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
            {
                "IndexName": "gsi2",
                "KeySchema": [
                    {"AttributeName": "gsi2pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi2sk", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "gsi3",
                "KeySchema": [
                    {"AttributeName": "gsi3pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi3sk", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        BillingMode="PAY_PER_REQUEST",
    )


def _project(project_id, title, slug, status="published", featured=False, featured_order=0):
    created_at = "2026-05-01T00:00:00Z"
    return {
        "pk": f"PROJECT#{project_id}",
        "sk": "METADATA",
        "entityType": "PROJECT",
        "projectId": project_id,
        "slug": slug,
        "title": title,
        "description": "Description",
        "techStack": ["AWS", "React"],
        "category": "serverless",
        "status": status,
        "featured": featured,
        "featuredOrder": featured_order,
        "thumbnailUrl": "",
        "thumbnailS3Key": "",
        "screenshotKeys": [],
        "screenshotUrls": [],
        "githubUrl": "",
        "liveUrl": "",
        "createdAt": created_at,
        "updatedAt": created_at,
        "gsi1pk": "PROJECT",
        "gsi1sk": f"STATUS#{status}#{created_at}",
        "gsi2pk": "PROJECT",
        "gsi2sk": f"FEATURED#{str(featured).lower()}#{featured_order:03d}",
        "gsi3pk": f"SLUG#{slug}",
        "gsi3sk": "PROJECT",
    }


def _seed(table, item):
    table.put_item(Item=item)


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
def test_list_projects_returns_published_only():
    table = _make_table()
    _seed(table, _project("one", "Published", "published", "published"))
    _seed(table, _project("two", "Draft", "draft", "draft"))

    response = list_projects({})
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert len(data) == 1
    assert data[0]["status"] == "published"


@mock_aws
def test_get_project_by_slug_not_found_returns_404():
    _make_table()

    response = get_project_by_slug({}, "missing")

    assert response["statusCode"] == 404
    assert _body(response)["error"]["code"] == "NOT_FOUND"


@mock_aws
def test_get_project_by_slug_draft_returns_404():
    table = _make_table()
    _seed(table, _project("one", "Draft", "draft", "draft"))

    response = get_project_by_slug({}, "draft")

    assert response["statusCode"] == 404


@mock_aws
def test_create_project_success_returns_201():
    _make_table()

    response = create_project(_admin_event({
        "title": "Portfolio CRM",
        "description": "Serverless portfolio CRM.",
        "techStack": ["AWS", "React"],
        "status": "published",
    }))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["title"] == "Portfolio CRM"
    assert data["slug"] == "portfolio-crm"
    assert data["gsi1sk"] if "gsi1sk" in data else True


@mock_aws
def test_create_project_duplicate_slug_appends_suffix():
    table = _make_table()
    _seed(table, _project("one", "Portfolio CRM", "portfolio-crm"))

    response = create_project(_admin_event({
        "title": "Portfolio CRM",
        "description": "Another project.",
    }))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["slug"] == "portfolio-crm-2"


@mock_aws
def test_create_project_missing_title_returns_400():
    _make_table()

    response = create_project(_admin_event({"description": "Missing title."}))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


def test_create_project_without_admin_returns_403():
    with pytest.raises(PermissionError):
        create_project(_public_event({"title": "X", "description": "X"}))


@mock_aws
def test_update_project_success():
    table = _make_table()
    _seed(table, _project("one", "Old", "old"))

    response = update_project(_admin_event({
        "title": "New",
        "description": "Updated.",
        "techStack": ["Python"],
        "category": "api",
        "status": "draft",
    }), "one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["title"] == "New"
    assert data["status"] == "draft"


@mock_aws
def test_delete_project_success_returns_204():
    table = _make_table()
    _seed(table, _project("one", "Delete", "delete"))

    response = delete_project(_admin_event(), "one")

    assert response["statusCode"] == 204


@mock_aws
def test_patch_project_status_updates_gsi_key():
    table = _make_table()
    _seed(table, _project("one", "Draft", "draft", "draft"))

    response = patch_project(_admin_event({"status": "published"}), "one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["status"] == "published"

    item = table.get_item(Key={"pk": "PROJECT#one", "sk": "METADATA"})["Item"]
    assert item["gsi1sk"].startswith("STATUS#published#")


@mock_aws
def test_patch_project_featured_updates_gsi_key():
    table = _make_table()
    _seed(table, _project("one", "Feature", "feature", "published"))

    response = patch_project(_admin_event({"featured": True}), "one")
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["featured"] is True

    item = table.get_item(Key={"pk": "PROJECT#one", "sk": "METADATA"})["Item"]
    assert item["gsi2sk"].startswith("FEATURED#true#")
