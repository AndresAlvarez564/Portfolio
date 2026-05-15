import json
import logging
import os
from datetime import datetime, timezone

import boto3

from utils.response import success, error
from utils.auth import require_group

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "portfolio-dev-main")

REQUIRED_FIELDS = ["problem", "solution", "architecture"]
MAX_LENGTHS = {
    "problem": 2000,
    "solution": 3000,
    "architecture": 3000,
    "challenges": 3000,
    "results": 3000,
}


def _table():
    return dynamodb.Table(TABLE_NAME)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _case_study_response(item):
    return {
        k: v for k, v in item.items()
        if k not in {"pk", "sk"}
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

    for field, max_len in MAX_LENGTHS.items():
        value = body.get(field)
        if value is not None and len(str(value)) > max_len:
            return f"The '{field}' field must not exceed {max_len} characters."

    return None


def get_case_study(event, project_id):
    """GET /projects/{id}/case-study - public. Returns optional case study."""
    response = _table().get_item(Key={"pk": f"PROJECT#{project_id}", "sk": "CASE_STUDY"})
    item = response.get("Item")
    return success(_case_study_response(item) if item else {})


def upsert_case_study(event, project_id):
    """PUT /projects/{id}/case-study - admin only. Creates or replaces a case study."""
    require_group(event, "admin")

    body = _parse_body(event)
    validation_error = _validate_body(body)
    if validation_error:
        return error("VALIDATION_ERROR", validation_error, 400)

    table = _table()
    existing = table.get_item(Key={"pk": f"PROJECT#{project_id}", "sk": "CASE_STUDY"}).get("Item")

    item = {
        "pk": f"PROJECT#{project_id}",
        "sk": "CASE_STUDY",
        "entityType": "CASE_STUDY",
        "projectId": project_id,
        "problem": body["problem"].strip(),
        "solution": body["solution"].strip(),
        "architecture": body["architecture"].strip(),
        "challenges": str(body.get("challenges", "")).strip(),
        "results": str(body.get("results", "")).strip(),
        "updatedAt": _now(),
    }

    table.put_item(Item=item)
    logger.info(json.dumps({
        "action": "upsert_case_study",
        "project_id": project_id,
        "is_new": existing is None,
    }))
    return success(_case_study_response(item))
