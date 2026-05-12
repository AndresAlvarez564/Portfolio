import json
import os
import logging
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

from utils.response import success, error
from utils.auth import require_group

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "portfolio-dev-main")

# Fields excluded from the public GET /profile response
_PRIVATE_FIELDS = {"email", "cvS3Key"}

# Required fields for PUT /profile
_REQUIRED_FIELDS = ["name", "title", "summary", "location"]

# Max lengths per field
_MAX_LENGTHS = {
    "name": 100,
    "title": 100,
    "summary": 1000,
    "location": 100,
}


def get_profile(event):
    """GET /profile — public. Returns sanitized profile settings."""
    table = dynamodb.Table(TABLE_NAME)

    response = table.get_item(Key={"pk": "PROFILE", "sk": "SETTINGS"})
    item = response.get("Item")

    if not item:
        logger.info(json.dumps({"action": "get_profile", "found": False}))
        return error("NOT_FOUND", "Profile settings not found.", 404)

    # Remove private fields before returning
    sanitized = {k: v for k, v in item.items() if k not in _PRIVATE_FIELDS}

    # Remove null/empty socialLinks values
    if "socialLinks" in sanitized and isinstance(sanitized["socialLinks"], dict):
        sanitized["socialLinks"] = {
            k: v for k, v in sanitized["socialLinks"].items() if v
        }

    logger.info(json.dumps({"action": "get_profile", "found": True}))
    return success(sanitized)


def update_profile(event):
    """PUT /profile — admin only. Updates profile settings."""
    require_group(event, "admin")

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("VALIDATION_ERROR", "Invalid JSON body.", 400)

    # Validate required fields
    for field in _REQUIRED_FIELDS:
        if not body.get(field) or not str(body[field]).strip():
            return error(
                "VALIDATION_ERROR",
                f"The '{field}' field is required.",
                400,
            )

    # Validate max lengths
    for field, max_len in _MAX_LENGTHS.items():
        value = body.get(field, "")
        if value and len(str(value)) > max_len:
            return error(
                "VALIDATION_ERROR",
                f"The '{field}' field must not exceed {max_len} characters.",
                400,
            )

    # Validate socialLinks is a dict if provided
    social_links = body.get("socialLinks", {})
    if not isinstance(social_links, dict):
        return error("VALIDATION_ERROR", "The 'socialLinks' field must be an object.", 400)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    table = dynamodb.Table(TABLE_NAME)

    table.update_item(
        Key={"pk": "PROFILE", "sk": "SETTINGS"},
        UpdateExpression=(
            "SET #name = :name, title = :title, summary = :summary, "
            "#location = :location, socialLinks = :socialLinks, updatedAt = :updatedAt"
        ),
        ExpressionAttributeNames={"#name": "name", "#location": "location"},
        ExpressionAttributeValues={
            ":name": body["name"].strip(),
            ":title": body["title"].strip(),
            ":summary": body["summary"].strip(),
            ":location": body["location"].strip(),
            ":socialLinks": social_links,
            ":updatedAt": now,
        },
    )

    # Return the updated record (sanitized)
    response = table.get_item(Key={"pk": "PROFILE", "sk": "SETTINGS"})
    item = response.get("Item", {})
    sanitized = {k: v for k, v in item.items() if k not in _PRIVATE_FIELDS}

    fields_updated = _REQUIRED_FIELDS + ["socialLinks"]
    logger.info(json.dumps({"action": "update_profile", "fields_updated": fields_updated}))

    return success(sanitized)
