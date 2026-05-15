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

REQUIRED_FIELDS = ["company", "title", "description", "startDate", "current"]
MAX_LENGTHS = {
    "company": 160,
    "title": 160,
    "description": 2000,
    "startDate": 20,
    "endDate": 20,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gsi1sk(order):
    return f"ORDER#{int(order):03d}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_experience(item):
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
        if field == "current":
            if "current" not in body or not isinstance(body["current"], bool):
                return "The 'current' field is required and must be a boolean."
            continue
        if not str(body.get(field, "")).strip():
            return f"The '{field}' field is required."

    if body.get("current") is False and not str(body.get("endDate", "")).strip():
        return "The 'endDate' field is required when current is false."

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    return None


def _get_item(table, experience_id):
    response = table.get_item(Key={"pk": f"EXPERIENCE#{experience_id}", "sk": "METADATA"})
    return response.get("Item")


def _list_items(table):
    response = table.query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("EXPERIENCE"),
        ScanIndexForward=True,
    )
    return response.get("Items", [])


def list_experience(event):
    """GET /experience - public. Returns all experience entries ordered by display order."""
    items = _list_items(_table())
    return success([_public_experience(item) for item in items])


def create_experience(event):
    """POST /experience - admin only. Creates a new experience entry."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    experience_id = str(uuid.uuid4())
    now = _now()
    order = len(_list_items(table)) + 1
    current = bool(body["current"])

    item = {
        "pk": f"EXPERIENCE#{experience_id}",
        "sk": "METADATA",
        "entityType": "EXPERIENCE",
        "experienceId": experience_id,
        "company": body["company"].strip(),
        "title": body["title"].strip(),
        "description": body["description"].strip(),
        "startDate": body["startDate"].strip(),
        "endDate": "" if current else body["endDate"].strip(),
        "current": current,
        "order": order,
        "createdAt": now,
        "updatedAt": now,
        "gsi1pk": "EXPERIENCE",
        "gsi1sk": _gsi1sk(order),
    }

    table.put_item(Item=item)
    logger.info(json.dumps({
        "action": "create_experience",
        "experience_id": experience_id,
        "company": item["company"],
    }))
    return success(_public_experience(item), status_code=201)


def update_experience(event, experience_id):
    """PUT /experience/{id} - admin only. Updates an experience entry."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    item = _get_item(table, experience_id)
    if not item:
        return error("NOT_FOUND", "Experience entry not found.", 404)

    current = bool(body["current"])
    updated = {
        **item,
        "company": body["company"].strip(),
        "title": body["title"].strip(),
        "description": body["description"].strip(),
        "startDate": body["startDate"].strip(),
        "endDate": "" if current else body["endDate"].strip(),
        "current": current,
        "updatedAt": _now(),
    }

    table.put_item(Item=updated)
    return success(_public_experience(updated))


def delete_experience(event, experience_id):
    """DELETE /experience/{id} - admin only. Deletes an experience entry."""
    require_group(event, "admin")

    table = _table()
    item = _get_item(table, experience_id)
    if not item:
        return error("NOT_FOUND", "Experience entry not found.", 404)

    table.delete_item(Key={"pk": f"EXPERIENCE#{experience_id}", "sk": "METADATA"})
    return {"statusCode": 204, "headers": success(None)["headers"], "body": ""}


def reorder_experience(event):
    """PATCH /experience/reorder - admin only. Updates display order for multiple entries."""
    require_group(event, "admin")

    body = _parse_body(event)
    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    ordered_ids = body.get("orderedIds")
    if not isinstance(ordered_ids, list) or not ordered_ids:
        return error("VALIDATION_ERROR", "The 'orderedIds' field must be a non-empty list.", 400)

    table = _table()
    updated_items = []
    for index, experience_id in enumerate(ordered_ids, start=1):
        item = _get_item(table, experience_id)
        if not item:
            return error("NOT_FOUND", f"Experience entry not found: {experience_id}", 404)

        updated = {
            **item,
            "order": index,
            "gsi1sk": _gsi1sk(index),
            "updatedAt": _now(),
        }
        table.put_item(Item=updated)
        updated_items.append(updated)

    logger.info(json.dumps({"action": "reorder_experience", "count": len(updated_items)}))
    return success([_public_experience(item) for item in updated_items])
