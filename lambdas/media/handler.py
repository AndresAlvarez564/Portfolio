import json
import re

from routes import media
from utils.response import error


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")

        if http_method == "GET" and path == "/media":
            return media.list_media(event)

        if http_method == "POST" and path == "/media/upload":
            return media.request_upload_url(event)

        if http_method == "POST" and path == "/media/confirm":
            return media.confirm_upload(event)

        match = re.match(r"^/media/([^/]+)$", path)
        if match and http_method == "DELETE":
            return media.delete_media(event, match.group(1))
    except PermissionError:
        return error("FORBIDDEN", "User does not have permission.", 403)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
