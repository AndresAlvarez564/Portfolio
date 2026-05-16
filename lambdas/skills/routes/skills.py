import json
import logging
import os
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

ALLOWED_CATEGORIES = {"cloud", "backend", "frontend", "devops", "databases"}
ALLOWED_VISIBILITIES = {"visible", "hidden"}
REQUIRED_FIELDS = ["name", "category", "visibility"]
MAX_LENGTHS = {
    "name": 120,
    "category": 40,
    "visibility": 20,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gsi1sk(visibility, category):
    return f"VISIBILITY#{visibility}#{category}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_skill(item):
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


def _validate_body(body):
    if body is None:
        return "Invalid JSON body."

    for field in REQUIRED_FIELDS:
        if not str(body.get(field, "")).strip():
            return f"The '{field}' field is required."

    category = str(body.get("category", "")).strip()
    if category not in ALLOWED_CATEGORIES:
        return "The 'category' field must be one of: cloud, backend, frontend, devops, databases."

    visibility = str(body.get("visibility", "")).strip()
    if visibility not in ALLOWED_VISIBILITIES:
        return "The 'visibility' field must be one of: visible, hidden."

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    if "order" in body:
        try:
            order = int(body.get("order"))
        except (TypeError, ValueError):
            return "The 'order' field must be a number."
        if order < 0:
            return "The 'order' field must be zero or greater."

    return None


def _get_item(table, skill_id):
    response = table.get_item(Key={"pk": f"SKILL#{skill_id}", "sk": "METADATA"})
    return response.get("Item")


def _list_items(table, visible_only=False):
    key_expression = Key("gsi1pk").eq("SKILL")
    if visible_only:
        key_expression = key_expression & Key("gsi1sk").begins_with("VISIBILITY#visible")

    response = table.query(
        IndexName="gsi1",
        KeyConditionExpression=key_expression,
        ScanIndexForward=True,
    )
    return sorted(
        response.get("Items", []),
        key=lambda item: (
            item.get("category", ""),
            int(item.get("order", 0)),
            item.get("name", ""),
        ),
    )


def list_skills(event):
    """GET /skills - public. Returns visible skills only."""
    items = _list_items(_table(), visible_only=True)
    return success([_public_skill(item) for item in items])


def list_skills_admin(event):
    """GET /skills/admin - admin only. Returns all skills."""
    require_group(event, "admin")

    items = _list_items(_table())
    return success([_public_skill(item) for item in items])


def create_skill(event):
    """POST /skills - admin only. Creates a new skill."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    skill_id = str(uuid.uuid4())
    now = _now()
    category = body["category"].strip()
    visibility = body["visibility"].strip()
    order = int(body.get("order", 0))
    item = {
        "pk": f"SKILL#{skill_id}",
        "sk": "METADATA",
        "entityType": "SKILL",
        "skillId": skill_id,
        "name": body["name"].strip(),
        "category": category,
        "visibility": visibility,
        "order": order,
        "createdAt": now,
        "updatedAt": now,
        "gsi1pk": "SKILL",
        "gsi1sk": _gsi1sk(visibility, category),
    }

    _table().put_item(Item=item)
    logger.info(json.dumps({
        "action": "create_skill",
        "skill_id": skill_id,
        "name": item["name"],
        "category": category,
    }))
    return success(_public_skill(item), status_code=201)


def update_skill(event, skill_id):
    """PUT /skills/{id} - admin only. Updates a skill."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    item = _get_item(table, skill_id)
    if not item:
        return error("NOT_FOUND", "Skill not found.", 404)

    category = body["category"].strip()
    visibility = body["visibility"].strip()
    visibility_changed = item.get("visibility") != visibility
    updated = {
        **item,
        "name": body["name"].strip(),
        "category": category,
        "visibility": visibility,
        "order": int(body.get("order", 0)),
        "updatedAt": _now(),
        "gsi1sk": _gsi1sk(visibility, category),
    }

    table.put_item(Item=updated)
    if visibility_changed:
        logger.info(json.dumps({
            "action": "update_skill_visibility",
            "skill_id": skill_id,
            "new_visibility": visibility,
        }))
    return success(_public_skill(updated))


def delete_skill(event, skill_id):
    """DELETE /skills/{id} - admin only. Deletes a skill."""
    require_group(event, "admin")

    table = _table()
    item = _get_item(table, skill_id)
    if not item:
        return error("NOT_FOUND", "Skill not found.", 404)

    table.delete_item(Key={"pk": f"SKILL#{skill_id}", "sk": "METADATA"})
    return {"statusCode": 204, "headers": success(None)["headers"], "body": ""}
