import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from utils.response import success, error
from utils.auth import require_group

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "portfolio-dev-main")
MEDIA_BUCKET_NAME = os.environ.get("MEDIA_BUCKET_NAME", "")
CLOUDFRONT_MEDIA_URL = os.environ.get("CLOUDFRONT_MEDIA_URL", "")

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
}
ALLOWED_CONTEXTS = {
    "project-screenshot",
    "project-thumbnail",
    "certification-badge",
    "cv",
    "diagram",
}
MAX_LENGTHS = {
    "filename": 255,
    "s3Key": 500,
    "mediaType": 80,
    "context": 80,
    "relatedId": 120,
    "contentType": 120,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _s3():
    return boto3.client("s3")


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gsi1sk(created_at, context, media_id):
    return f"CREATED#{created_at}#CONTEXT#{context}#MEDIA#{media_id}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_media(item):
    return {
        key: _to_json_value(value)
        for key, value in item.items()
        if key not in {"pk", "sk", "gsi1pk", "gsi1sk"}
    }


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None


def _sanitize_filename(filename):
    base = str(filename).strip().split("/")[-1].split("\\")[-1]
    return re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip("-") or "upload"


def _media_url(s3_key):
    base = os.environ.get("CLOUDFRONT_MEDIA_URL", CLOUDFRONT_MEDIA_URL).rstrip("/")
    if not base:
        return f"/{s3_key}"
    if not base.startswith("http://") and not base.startswith("https://"):
        base = f"https://{base}"
    return f"{base}/{s3_key}"


def _validate_lengths(body, fields):
    for field in fields:
        value = body.get(field)
        max_len = MAX_LENGTHS.get(field)
        if value is not None and max_len and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."
    return None


def _get_item(table, media_id):
    response = table.get_item(Key={"pk": f"MEDIA#{media_id}", "sk": "METADATA"})
    return response.get("Item")


def list_media(event):
    """GET /media - admin only. Returns all media files."""
    require_group(event, "admin")

    response = _table().query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("MEDIA"),
        ScanIndexForward=False,
    )
    return success([_public_media(item) for item in response.get("Items", [])])


def request_upload_url(event):
    """POST /media/upload - admin only. Generates a pre-signed S3 upload URL."""
    require_group(event, "admin")

    body = _parse_body(event)
    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    filename = _sanitize_filename(body.get("filename", ""))
    content_type = str(body.get("contentType", "")).strip()
    context = str(body.get("context", "")).strip()

    if not filename:
        return error("VALIDATION_ERROR", "The 'filename' field is required.", 400)
    if content_type not in ALLOWED_CONTENT_TYPES:
        return error("VALIDATION_ERROR", "The 'contentType' field is not allowed.", 400)
    if context not in ALLOWED_CONTEXTS:
        return error("VALIDATION_ERROR", "The 'context' field is not allowed.", 400)

    length_error = _validate_lengths(
        {"filename": filename, "contentType": content_type, "context": context},
        ["filename", "contentType", "context"],
    )
    if length_error:
        return error("VALIDATION_ERROR", length_error, 400)

    s3_key = f"media/{context}/{uuid.uuid4()}-{filename}"
    upload_url = _s3().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": os.environ.get("MEDIA_BUCKET_NAME", MEDIA_BUCKET_NAME),
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=300,
    )

    logger.info(json.dumps({
        "action": "request_upload_url",
        "context": context,
        "content_type": content_type,
    }))
    return success({"uploadUrl": upload_url, "s3Key": s3_key})


def confirm_upload(event):
    """POST /media/confirm - admin only. Saves media metadata after S3 upload."""
    require_group(event, "admin")

    body = _parse_body(event)
    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    s3_key = str(body.get("s3Key", "")).strip()
    media_type = str(body.get("mediaType", "")).strip()
    context = str(body.get("context", media_type)).strip()
    related_id = str(body.get("relatedId", "")).strip()
    filename = str(body.get("filename", "")).strip() or s3_key.split("/")[-1]
    content_type = str(body.get("contentType", "")).strip()

    if not s3_key:
        return error("VALIDATION_ERROR", "The 's3Key' field is required.", 400)
    if not media_type:
        return error("VALIDATION_ERROR", "The 'mediaType' field is required.", 400)
    if context not in ALLOWED_CONTEXTS:
        return error("VALIDATION_ERROR", "The 'context' field is not allowed.", 400)

    length_error = _validate_lengths(
        {
            "s3Key": s3_key,
            "mediaType": media_type,
            "context": context,
            "relatedId": related_id,
            "filename": filename,
            "contentType": content_type,
        },
        ["s3Key", "mediaType", "context", "relatedId", "filename", "contentType"],
    )
    if length_error:
        return error("VALIDATION_ERROR", length_error, 400)

    bucket_name = os.environ.get("MEDIA_BUCKET_NAME", MEDIA_BUCKET_NAME)
    try:
        head = _s3().head_object(Bucket=bucket_name, Key=s3_key)
    except ClientError:
        return error("VALIDATION_ERROR", "Uploaded object was not found.", 400)

    media_id = str(uuid.uuid4())
    now = _now()
    item = {
        "pk": f"MEDIA#{media_id}",
        "sk": "METADATA",
        "entityType": "MEDIA",
        "mediaId": media_id,
        "s3Key": s3_key,
        "cloudfrontUrl": _media_url(s3_key),
        "mediaType": media_type,
        "context": context,
        "relatedId": related_id,
        "filename": filename,
        "contentType": content_type or head.get("ContentType", ""),
        "sizeBytes": int(body.get("sizeBytes") or head.get("ContentLength", 0)),
        "createdAt": now,
        "updatedAt": now,
        "gsi1pk": "MEDIA",
        "gsi1sk": _gsi1sk(now, context, media_id),
    }

    table = _table()
    table.put_item(Item=item)
    if context == "cv":
        table.update_item(
            Key={"pk": "PROFILE", "sk": "SETTINGS"},
            UpdateExpression="SET cvFileUrl = :cvFileUrl, cvS3Key = :cvS3Key, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ":cvFileUrl": item["cloudfrontUrl"],
                ":cvS3Key": s3_key,
                ":updatedAt": now,
            },
        )

    logger.info(json.dumps({
        "action": "confirm_upload",
        "media_id": media_id,
        "s3_key": s3_key,
        "context": context,
    }))
    return success(_public_media(item), status_code=201)


def delete_media(event, media_id):
    """DELETE /media/{id} - admin only. Deletes media record and S3 object."""
    require_group(event, "admin")

    table = _table()
    item = _get_item(table, media_id)
    if not item:
        return error("NOT_FOUND", "Media record not found.", 404)

    s3_key = item["s3Key"]
    _s3().delete_object(Bucket=os.environ.get("MEDIA_BUCKET_NAME", MEDIA_BUCKET_NAME), Key=s3_key)
    table.delete_item(Key={"pk": f"MEDIA#{media_id}", "sk": "METADATA"})
    logger.info(json.dumps({
        "action": "delete_media",
        "media_id": media_id,
        "s3_key": s3_key,
    }))
    return {"statusCode": 204, "headers": success(None)["headers"], "body": ""}
