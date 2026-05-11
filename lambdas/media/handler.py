# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
import re
from routes import media


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /media — admin only
    if http_method == "GET" and path == "/media":
        return media.list_media(event)

    # POST /media/upload — admin only
    if http_method == "POST" and path == "/media/upload":
        return media.request_upload_url(event)

    # POST /media/confirm — admin only
    if http_method == "POST" and path == "/media/confirm":
        return media.confirm_upload(event)

    # DELETE /media/{id} — admin only
    match = re.match(r"^/media/([^/]+)$", path)
    if match and http_method == "DELETE":
        return media.delete_media(event, match.group(1))

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
