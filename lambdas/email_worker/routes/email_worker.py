import json
import logging
import os

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))

REQUIRED_FIELDS = ["messageId", "name", "email", "subject", "message"]


def _ses():
    return boto3.client("ses")


def _parse_body(record):
    try:
        body = json.loads(record.get("body") or "{}")
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid SQS message body.") from exc

    missing = [field for field in REQUIRED_FIELDS if not str(body.get(field, "")).strip()]
    if missing:
        raise ValueError(f"Missing required contact message fields: {', '.join(missing)}")

    return body


def _email_body(message):
    optional_rows = []
    if message.get("company"):
        optional_rows.append(f"Company: {message['company']}")
    if message.get("projectType"):
        optional_rows.append(f"Project type: {message['projectType']}")
    if message.get("budget"):
        optional_rows.append(f"Budget: {message['budget']}")

    details = "\n".join([
        f"Message ID: {message['messageId']}",
        f"Name: {message['name']}",
        f"Email: {message['email']}",
        *optional_rows,
        f"Subject: {message['subject']}",
        "",
        message["message"],
    ])

    return details


def process_record(record):
    message = _parse_body(record)
    from_email = os.environ["SES_FROM_EMAIL"]
    to_email = os.environ["SES_TO_EMAIL"]
    message_id = message["messageId"]

    try:
        _ses().send_email(
            Source=from_email,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"New contact message: {message['subject']}"},
                "Body": {"Text": {"Data": _email_body(message)}},
            },
            ReplyToAddresses=[message["email"]],
        )
    except ClientError as exc:
        logger.error(json.dumps({
            "action": "send_contact_email",
            "message_id": message_id,
            "error": str(exc),
        }))
        raise

    logger.info(json.dumps({
        "action": "send_contact_email",
        "message_id": message_id,
        "to": to_email,
        "success": True,
    }))
