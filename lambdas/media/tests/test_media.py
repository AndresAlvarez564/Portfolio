import json
import os

import boto3
import pytest
from moto import mock_aws

os.environ["TABLE_NAME"] = "portfolio-dev-main"
os.environ["MEDIA_BUCKET_NAME"] = "portfolio-dev-media"
os.environ["CLOUDFRONT_MEDIA_URL"] = "https://media.example.com"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.media import confirm_upload, delete_media, list_media, request_upload_url


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


def _make_bucket():
    boto3.client("s3", region_name="us-east-1").create_bucket(Bucket="portfolio-dev-media")


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


def _upload_body(**overrides):
    body = {
        "filename": "badge.png",
        "contentType": "image/png",
        "context": "certification-badge",
    }
    body.update(overrides)
    return body


def _confirm_body(**overrides):
    body = {
        "s3Key": "media/certification-badge/badge.png",
        "mediaType": "certification-badge",
        "context": "certification-badge",
        "relatedId": "cert-one",
        "filename": "badge.png",
        "contentType": "image/png",
        "sizeBytes": 123,
    }
    body.update(overrides)
    return body


def _media(media_id, s3_key="media/certification-badge/badge.png"):
    return {
        "pk": f"MEDIA#{media_id}",
        "sk": "METADATA",
        "entityType": "MEDIA",
        "mediaId": media_id,
        "s3Key": s3_key,
        "cloudfrontUrl": f"https://media.example.com/{s3_key}",
        "mediaType": "certification-badge",
        "context": "certification-badge",
        "relatedId": "cert-one",
        "filename": "badge.png",
        "contentType": "image/png",
        "sizeBytes": 123,
        "createdAt": "2026-05-01T00:00:00Z",
        "updatedAt": "2026-05-01T00:00:00Z",
        "gsi1pk": "MEDIA",
        "gsi1sk": f"CREATED#2026-05-01T00:00:00Z#CONTEXT#certification-badge#MEDIA#{media_id}",
    }


@mock_aws
def test_request_upload_url_returns_presigned_url():
    _make_bucket()

    response = request_upload_url(_admin_event(_upload_body()))
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert data["uploadUrl"].startswith("https://")
    assert data["s3Key"].startswith("media/certification-badge/")


@mock_aws
def test_request_upload_url_invalid_content_type_returns_400():
    _make_bucket()

    response = request_upload_url(_admin_event(_upload_body(contentType="text/plain")))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_request_upload_url_without_admin_returns_403():
    _make_bucket()

    with pytest.raises(PermissionError):
        request_upload_url(_public_event(_upload_body()))


@mock_aws
def test_confirm_upload_saves_media_record():
    _make_table()
    _make_bucket()
    boto3.client("s3").put_object(Bucket="portfolio-dev-media", Key="media/certification-badge/badge.png", Body=b"png")

    response = confirm_upload(_admin_event(_confirm_body()))
    data = _body(response)["data"]

    assert response["statusCode"] == 201
    assert data["cloudfrontUrl"] == "https://media.example.com/media/certification-badge/badge.png"
    assert data["s3Key"] == "media/certification-badge/badge.png"


@mock_aws
def test_confirm_upload_cv_updates_profile_settings():
    table = _make_table()
    _make_bucket()
    boto3.client("s3").put_object(Bucket="portfolio-dev-media", Key="media/cv/resume.pdf", Body=b"pdf")
    table.put_item(Item={"pk": "PROFILE", "sk": "SETTINGS", "name": "Andre"})

    response = confirm_upload(_admin_event(_confirm_body(
        s3Key="media/cv/resume.pdf",
        mediaType="cv",
        context="cv",
        filename="resume.pdf",
        contentType="application/pdf",
    )))

    assert response["statusCode"] == 201
    profile = table.get_item(Key={"pk": "PROFILE", "sk": "SETTINGS"})["Item"]
    assert profile["cvFileUrl"] == "https://media.example.com/media/cv/resume.pdf"
    assert profile["cvS3Key"] == "media/cv/resume.pdf"


@mock_aws
def test_confirm_upload_s3_object_not_found_returns_400():
    _make_table()
    _make_bucket()

    response = confirm_upload(_admin_event(_confirm_body()))

    assert response["statusCode"] == 400
    assert _body(response)["error"]["code"] == "VALIDATION_ERROR"


@mock_aws
def test_list_media_returns_all():
    table = _make_table()
    table.put_item(Item=_media("one"))
    table.put_item(Item=_media("two", "media/diagram/two.svg"))

    response = list_media(_admin_event())
    data = _body(response)["data"]

    assert response["statusCode"] == 200
    assert {item["mediaId"] for item in data} == {"one", "two"}


@mock_aws
def test_delete_media_removes_from_s3_and_dynamodb():
    table = _make_table()
    _make_bucket()
    boto3.client("s3").put_object(Bucket="portfolio-dev-media", Key="media/certification-badge/badge.png", Body=b"png")
    table.put_item(Item=_media("one"))

    response = delete_media(_admin_event(), "one")

    assert response["statusCode"] == 204
    assert "Item" not in table.get_item(Key={"pk": "MEDIA#one", "sk": "METADATA"})
    objects = boto3.client("s3").list_objects_v2(Bucket="portfolio-dev-media")
    assert objects.get("KeyCount", 0) == 0


@mock_aws
def test_delete_media_without_admin_returns_403():
    _make_table()

    with pytest.raises(PermissionError):
        delete_media(_public_event(), "one")
