# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
import re
from routes import certifications


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /certifications — public
    if http_method == "GET" and path == "/certifications":
        return certifications.list_certifications(event)

    # POST /certifications — admin only
    if http_method == "POST" and path == "/certifications":
        return certifications.create_certification(event)

    # PUT /certifications/{id} — admin only
    # DELETE /certifications/{id} — admin only
    match = re.match(r"^/certifications/([^/]+)$", path)
    if match:
        certification_id = match.group(1)
        if http_method == "PUT":
            return certifications.update_certification(event, certification_id)
        if http_method == "DELETE":
            return certifications.delete_certification(event, certification_id)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
