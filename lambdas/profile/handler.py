# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
from routes import profile


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /profile — public
    if http_method == "GET" and path == "/profile":
        return profile.get_profile(event)

    # PUT /profile — admin only
    if http_method == "PUT" and path == "/profile":
        return profile.update_profile(event)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
