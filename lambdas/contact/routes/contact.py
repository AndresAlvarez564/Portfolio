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
CONTACT_QUEUE_URL = os.environ.get("CONTACT_QUEUE_URL", "")

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ALLOWED_STATUSES = {"unread", "read", "archived"}
REQUIRED_FIELDS = ["name", "email", "subject", "message"]
MAX_LENGTHS = {
    "name": 120,
    "email": 254,
    "phone": 30,
    "company": 160,
    "projectType": 120,
    "budget": 80,
    "subject": 180,
    "message": 2000,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gsi1sk(created_at, status, message_id):
    return f"CREATED#{created_at}#STATUS#{status}#MESSAGE#{message_id}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_message(item):
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


def _query_params(event):
    return event.get("queryStringParameters") or {}


def _validate_submit_body(body):
    if body is None:
        return "Invalid JSON body."

    for field in REQUIRED_FIELDS:
        if not str(body.get(field, "")).strip():
            return f"The '{field}' field is required."

    if not EMAIL_PATTERN.match(str(body.get("email", "")).strip()):
        return "The 'email' field must be a valid email address."

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    return None


def _get_item(table, message_id):
    response = table.get_item(Key={"pk": f"CONTACT#{message_id}", "sk": "MESSAGE"})
    return response.get("Item")


def _send_notification(item):
    queue_url = os.environ.get("CONTACT_QUEUE_URL", CONTACT_QUEUE_URL)
    if not queue_url:
        return

    boto3.client("sqs").send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(_public_message(item)),
    )


def submit_contact(event):
    """POST /contact - public. Validates and saves a contact form submission."""
    body = _parse_body(event)

    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    if str(body.get("website", "")).strip() or str(body.get("honeypot", "")).strip():
        logger.warning(json.dumps({
            "action": "submit_contact",
            "honeypot_triggered": True,
        }))
        return success({"message": "Your message has been sent."})

    validation_error = _validate_submit_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    message_id = str(uuid.uuid4())
    now = _now()
    status = "unread"
    item = {
        "pk": f"CONTACT#{message_id}",
        "sk": "MESSAGE",
        "entityType": "CONTACT_MESSAGE",
        "messageId": message_id,
        "name": body["name"].strip(),
        "email": body["email"].strip(),
        "phone": str(body.get("phone", "")).strip(),
        "company": str(body.get("company", "")).strip(),
        "projectType": str(body.get("projectType", "")).strip(),
        "budget": str(body.get("budget", "")).strip(),
        "subject": body["subject"].strip(),
        "message": body["message"].strip(),
        "status": status,
        "createdAt": now,
        "updatedAt": now,
        "gsi1pk": "CONTACT",
        "gsi1sk": _gsi1sk(now, status, message_id),
    }

    _table().put_item(Item=item)
    _send_notification(item)
    logger.info(json.dumps({
        "action": "submit_contact",
        "message_id": message_id,
        "honeypot_triggered": False,
    }))
    return success({"message": "Your message has been sent."})


def list_messages(event):
    """GET /contact - admin only. Returns all contact messages ordered by date."""
    require_group(event, "admin")

    status = _query_params(event).get("status")
    if status and status not in ALLOWED_STATUSES:
        return error("VALIDATION_ERROR", "The 'status' filter must be one of: unread, read, archived.", 400)

    response = _table().query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("CONTACT"),
        ScanIndexForward=False,
    )
    items = response.get("Items", [])
    if status:
        items = [item for item in items if item.get("status") == status]

    return success([_public_message(item) for item in items])


def get_message(event, message_id):
    """GET /contact/{id} - admin only. Returns a single contact message."""
    require_group(event, "admin")

    item = _get_item(_table(), message_id)
    if not item:
        return error("NOT_FOUND", "Contact message not found.", 404)

    return success(_public_message(item))


def update_message_status(event, message_id):
    """PATCH /contact/{id} - admin only. Updates message status."""
    require_group(event, "admin")

    body = _parse_body(event)
    if body is None:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    status = str(body.get("status", "")).strip()
    if status not in ALLOWED_STATUSES:
        return error("VALIDATION_ERROR", "The 'status' field must be one of: unread, read, archived.", 400)

    table = _table()
    item = _get_item(table, message_id)
    if not item:
        return error("NOT_FOUND", "Contact message not found.", 404)

    updated = {
        **item,
        "status": status,
        "updatedAt": _now(),
        "gsi1sk": _gsi1sk(item["createdAt"], status, message_id),
    }

    table.put_item(Item=updated)
    logger.info(json.dumps({
        "action": "update_message_status",
        "message_id": message_id,
        "new_status": status,
    }))
    return success(_public_message(updated))
