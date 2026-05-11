# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
import re
from routes import contact


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # POST /contact — public (spam-protected)
    if http_method == "POST" and path == "/contact":
        return contact.submit_contact(event)

    # GET /contact — admin only
    if http_method == "GET" and path == "/contact":
        return contact.list_messages(event)

    # GET /contact/{id} — admin only
    # PATCH /contact/{id} — admin only
    match = re.match(r"^/contact/([^/]+)$", path)
    if match:
        message_id = match.group(1)
        if http_method == "GET":
            return contact.get_message(event, message_id)
        if http_method == "PATCH":
            return contact.update_message_status(event, message_id)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
