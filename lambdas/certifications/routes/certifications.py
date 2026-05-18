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

DATE_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
REQUIRED_FIELDS = ["name", "issuer"]
MAX_LENGTHS = {
    "name": 180,
    "issuer": 160,
    "issueDate": 7,
    "expirationDate": 7,
    "verificationUrl": 500,
    "badgeUrl": 500,
    "badgeS3Key": 500,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gsi1sk(issue_date, certification_id):
    return f"ISSUE_DATE#{issue_date}#CERTIFICATION#{certification_id}"


def _to_json_value(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, list):
        return [_to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_json_value(item) for key, item in value.items()}
    return value


def _public_certification(item):
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

    in_progress = bool(body.get("inProgress", False))
    issue_date = str(body.get("issueDate", "")).strip()

    if not in_progress:
        if not issue_date:
            return "The 'issueDate' field is required."
        if not DATE_PATTERN.match(issue_date):
            return "The 'issueDate' field must use YYYY-MM format."
    elif issue_date and not DATE_PATTERN.match(issue_date):
        return "The 'issueDate' field must use YYYY-MM format."

    expiration_date = str(body.get("expirationDate", "")).strip()
    if expiration_date and not DATE_PATTERN.match(expiration_date):
        return "The 'expirationDate' field must use YYYY-MM format."

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    return None


def _get_item(table, certification_id):
    response = table.get_item(Key={"pk": f"CERTIFICATION#{certification_id}", "sk": "METADATA"})
    return response.get("Item")


def _list_items(table):
    response = table.query(
        IndexName="gsi1",
        KeyConditionExpression=Key("gsi1pk").eq("CERTIFICATION"),
        ScanIndexForward=False,
    )
    return response.get("Items", [])


def list_certifications(event):
    """GET /certifications - public. Returns all certifications sorted by issue date."""
    items = _list_items(_table())
    return success([_public_certification(item) for item in items])


def create_certification(event):
    """POST /certifications - admin only. Creates a new certification."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    certification_id = str(uuid.uuid4())
    now = _now()
    in_progress = bool(body.get("inProgress", False))
    issue_date = str(body.get("issueDate", "")).strip()
    gsi_date = "9999-99" if in_progress else issue_date
    item = {
        "pk": f"CERTIFICATION#{certification_id}",
        "sk": "METADATA",
        "entityType": "CERTIFICATION",
        "certificationId": certification_id,
        "name": body["name"].strip(),
        "issuer": body["issuer"].strip(),
        "issueDate": issue_date,
        "expirationDate": str(body.get("expirationDate", "")).strip(),
        "verificationUrl": str(body.get("verificationUrl", "")).strip(),
        "badgeUrl": str(body.get("badgeUrl", "")).strip(),
        "badgeS3Key": str(body.get("badgeS3Key", "")).strip(),
        "inProgress": in_progress,
        "createdAt": now,
        "updatedAt": now,
        "gsi1pk": "CERTIFICATION",
        "gsi1sk": _gsi1sk(gsi_date, certification_id),
    }

    _table().put_item(Item=item)
    logger.info(json.dumps({
        "action": "create_certification",
        "certification_id": certification_id,
        "name": item["name"],
        "issuer": item["issuer"],
    }))
    return success(_public_certification(item), status_code=201)


def update_certification(event, certification_id):
    """PUT /certifications/{id} - admin only. Updates a certification."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    item = _get_item(table, certification_id)
    if not item:
        return error("NOT_FOUND", "Certification not found.", 404)

    in_progress = bool(body.get("inProgress", False))
    issue_date = str(body.get("issueDate", "")).strip()
    gsi_date = "9999-99" if in_progress else issue_date
    updated = {
        **item,
        "name": body["name"].strip(),
        "issuer": body["issuer"].strip(),
        "issueDate": issue_date,
        "expirationDate": str(body.get("expirationDate", "")).strip(),
        "verificationUrl": str(body.get("verificationUrl", "")).strip(),
        "badgeUrl": str(body.get("badgeUrl", "")).strip(),
        "badgeS3Key": str(body.get("badgeS3Key", "")).strip(),
        "inProgress": in_progress,
        "updatedAt": _now(),
        "gsi1sk": _gsi1sk(gsi_date, certification_id),
    }

    table.put_item(Item=updated)
    return success(_public_certification(updated))


def delete_certification(event, certification_id):
    """DELETE /certifications/{id} - admin only. Deletes a certification."""
    require_group(event, "admin")

    table = _table()
    item = _get_item(table, certification_id)
    if not item:
        return error("NOT_FOUND", "Certification not found.", 404)

    table.delete_item(Key={"pk": f"CERTIFICATION#{certification_id}", "sk": "METADATA"})
    logger.info(json.dumps({
        "action": "delete_certification",
        "certification_id": certification_id,
    }))
    return {"statusCode": 204, "headers": success(None)["headers"], "body": ""}
