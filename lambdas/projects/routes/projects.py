import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

from utils.response import success, error
from utils.auth import require_group

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "portfolio-dev-main")

VALID_STATUSES = {"draft", "published", "in-progress"}
REQUIRED_FIELDS = ["title", "description"]
MAX_LENGTHS = {
    "title": 160,
    "description": 1200,
    "category": 80,
    "githubUrl": 500,
    "liveUrl": 500,
    "thumbnailUrl": 500,
    "thumbnailS3Key": 500,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _slugify(value):
    slug = value.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug).strip("-")
    return (slug or "project")[:80].strip("-") or "project"


def _gsi1sk(status, created_at):
    return f"STATUS#{status}#{created_at}"


def _gsi2sk(featured, featured_order):
    order = int(featured_order or 0)
    return f"FEATURED#{str(bool(featured)).lower()}#{order:03d}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_project(item):
    return {
        k: _to_json_value(v) for k, v in item.items()
        if k not in {"pk", "sk", "gsi1pk", "gsi1sk", "gsi2pk", "gsi2sk", "gsi3pk", "gsi3sk"}
    }


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None


def _validate_project_body(body, partial=False):
    if body is None:
        return "Invalid JSON body."

    if not partial:
        for field in REQUIRED_FIELDS:
            if not str(body.get(field, "")).strip():
                return f"The '{field}' field is required."

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    if "techStack" in body and not isinstance(body["techStack"], list):
        return "The 'techStack' field must be a list."

    if "screenshotUrls" in body and not isinstance(body["screenshotUrls"], list):
        return "The 'screenshotUrls' field must be a list."

    if "screenshotKeys" in body and not isinstance(body["screenshotKeys"], list):
        return "The 'screenshotKeys' field must be a list."

    if "status" in body and body["status"] not in VALID_STATUSES:
        return "The 'status' field must be 'draft', 'published', or 'in-progress'."

    if "featured" in body and not isinstance(body["featured"], bool):
        return "The 'featured' field must be a boolean."

    if "featuredOrder" in body and body["featuredOrder"] is not None:
        try:
            int(body["featuredOrder"])
        except (TypeError, ValueError):
            return "The 'featuredOrder' field must be a number."

    return None


def _slug_exists(table, slug):
    response = table.query(
        IndexName="gsi3",
        KeyConditionExpression=Key("gsi3pk").eq(f"SLUG#{slug}") & Key("gsi3sk").eq("PROJECT"),
        Limit=1,
    )
    return bool(response.get("Items"))


def _unique_slug(table, title):
    base_slug = _slugify(title)
    slug = base_slug
    suffix = 2

    while _slug_exists(table, slug):
        suffix_text = f"-{suffix}"
        slug = f"{base_slug[:80 - len(suffix_text)].rstrip('-')}{suffix_text}"
        suffix += 1

    return slug


def _get_project_item(table, project_id):
    response = table.get_item(Key={"pk": f"PROJECT#{project_id}", "sk": "METADATA"})
    return response.get("Item")


def _featured_count(table):
    response = table.query(
        IndexName="gsi2",
        KeyConditionExpression=Key("gsi2pk").eq("PROJECT") & Key("gsi2sk").begins_with("FEATURED#true#"),
        Select="COUNT",
    )
    return int(response.get("Count", 0))


def list_projects(event):
    """GET /projects - public. Returns published and in-progress projects."""
    table = _table()
    published = table.query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("PROJECT") & Key("gsi1sk").begins_with("STATUS#published#"),
        ScanIndexForward=False,
    ).get("Items", [])
    in_progress = table.query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("PROJECT") & Key("gsi1sk").begins_with("STATUS#in-progress#"),
        ScanIndexForward=False,
    ).get("Items", [])
    return success([_public_project(item) for item in in_progress + published])


def list_projects_admin(event):
    """GET /projects/admin - admin only. Returns all projects including drafts."""
    require_group(event, "admin")

    table = _table()
    response = table.query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("PROJECT"),
        ScanIndexForward=False,
    )
    return success([_public_project(item) for item in response.get("Items", [])])


def get_project_by_slug(event, slug):
    """GET /projects/{slug} - public. Returns published project by slug."""
    table = _table()
    response = table.query(
        IndexName="gsi3",
        KeyConditionExpression=Key("gsi3pk").eq(f"SLUG#{slug}") & Key("gsi3sk").eq("PROJECT"),
        Limit=1,
    )
    items = response.get("Items", [])
    if not items or items[0].get("status") not in {"published", "in-progress"}:
        return error("NOT_FOUND", "Project not found.", 404)

    return success(_public_project(items[0]))


def get_project_admin(event, project_id):
    """GET /projects/{id}/admin - admin only. Returns project by ID including drafts."""
    require_group(event, "admin")

    item = _get_project_item(_table(), project_id)
    if not item:
        return error("NOT_FOUND", "Project not found.", 404)
    return success(_public_project(item))


def create_project(event):
    """POST /projects - admin only. Creates a new project."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_project_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    project_id = str(uuid.uuid4())
    created_at = _now()
    status = body.get("status", "draft")
    featured = bool(body.get("featured", False))
    featured_order = int(body.get("featuredOrder") or (_featured_count(table) + 1 if featured else 0))
    slug = _unique_slug(table, body["title"])

    item = {
        "pk": f"PROJECT#{project_id}",
        "sk": "METADATA",
        "entityType": "PROJECT",
        "projectId": project_id,
        "slug": slug,
        "title": body["title"].strip(),
        "description": body["description"].strip(),
        "techStack": body.get("techStack", []),
        "category": body.get("category", ""),
        "status": status,
        "featured": featured,
        "featuredOrder": featured_order if featured else 0,
        "thumbnailUrl": body.get("thumbnailUrl", ""),
        "thumbnailS3Key": body.get("thumbnailS3Key", ""),
        "screenshotKeys": body.get("screenshotKeys", []),
        "screenshotUrls": body.get("screenshotUrls", []),
        "githubUrl": body.get("githubUrl", ""),
        "liveUrl": body.get("liveUrl", ""),
        "createdAt": created_at,
        "updatedAt": created_at,
        "gsi1pk": "PROJECT",
        "gsi1sk": _gsi1sk(status, created_at),
        "gsi2pk": "PROJECT",
        "gsi2sk": _gsi2sk(featured, featured_order if featured else 0),
        "gsi3pk": f"SLUG#{slug}",
        "gsi3sk": "PROJECT",
    }

    table.put_item(Item=item)
    logger.info(json.dumps({"action": "create_project", "project_id": project_id, "slug": slug}))
    return success(_public_project(item), status_code=201)


def update_project(event, project_id):
    """PUT /projects/{id} - admin only. Updates a project."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_project_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    item = _get_project_item(table, project_id)
    if not item:
        return error("NOT_FOUND", "Project not found.", 404)

    status = body.get("status", item.get("status", "draft"))
    featured = bool(body.get("featured", item.get("featured", False)))
    featured_order = int(body.get("featuredOrder") or item.get("featuredOrder") or 0)
    if featured and featured_order == 0:
        featured_order = _featured_count(table) + 1

    updated = {
        **item,
        "title": body["title"].strip(),
        "description": body["description"].strip(),
        "techStack": body.get("techStack", []),
        "category": body.get("category", ""),
        "status": status,
        "featured": featured,
        "featuredOrder": featured_order if featured else 0,
        "thumbnailUrl": body.get("thumbnailUrl", ""),
        "thumbnailS3Key": body.get("thumbnailS3Key", ""),
        "screenshotKeys": body.get("screenshotKeys", []),
        "screenshotUrls": body.get("screenshotUrls", []),
        "githubUrl": body.get("githubUrl", ""),
        "liveUrl": body.get("liveUrl", ""),
        "updatedAt": _now(),
        "gsi1sk": _gsi1sk(status, item["createdAt"]),
        "gsi2sk": _gsi2sk(featured, featured_order if featured else 0),
    }

    table.put_item(Item=updated)
    return success(_public_project(updated))


def delete_project(event, project_id):
    """DELETE /projects/{id} - admin only. Deletes a project."""
    require_group(event, "admin")

    table = _table()
    item = _get_project_item(table, project_id)
    if not item:
        return error("NOT_FOUND", "Project not found.", 404)

    table.delete_item(Key={"pk": f"PROJECT#{project_id}", "sk": "METADATA"})
    logger.info(json.dumps({"action": "delete_project", "project_id": project_id}))
    return {"statusCode": 204, "headers": success(None)["headers"], "body": ""}


def patch_project(event, project_id):
    """PATCH /projects/{id} - admin only. Updates status or featured flag."""
    require_group(event, "admin")

    body = _parse_body(event)
    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    allowed_fields = {"status", "featured", "featuredOrder"}
    provided = allowed_fields.intersection(body.keys())
    if not provided:
        return error("VALIDATION_ERROR", "Provide status, featured, or featuredOrder.", 400)

    validation_error = _validate_project_body(body, partial=True)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    item = _get_project_item(table, project_id)
    if not item:
        return error("NOT_FOUND", "Project not found.", 404)

    status = body.get("status", item.get("status", "draft"))
    featured = body.get("featured", item.get("featured", False))
    featured_order = int(body.get("featuredOrder") or item.get("featuredOrder") or 0)
    if featured and featured_order == 0:
        featured_order = _featured_count(table) + 1

    updated = {
        **item,
        "status": status,
        "featured": bool(featured),
        "featuredOrder": featured_order if featured else 0,
        "updatedAt": _now(),
        "gsi1sk": _gsi1sk(status, item["createdAt"]),
        "gsi2sk": _gsi2sk(featured, featured_order if featured else 0),
    }

    table.put_item(Item=updated)
    field = "status" if "status" in body else "featured"
    logger.info(json.dumps({
        "action": "patch_project",
        "project_id": project_id,
        "field": field,
        "value": updated.get(field),
    }))
    return success(_public_project(updated))
