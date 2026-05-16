import json
import re

from routes import contact
from utils.response import error


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")

        if http_method == "POST" and path == "/contact":
            return contact.submit_contact(event)

        if http_method == "GET" and path == "/contact":
            return contact.list_messages(event)

        match = re.match(r"^/contact/([^/]+)$", path)
        if match:
            message_id = match.group(1)
            if http_method == "GET":
                return contact.get_message(event, message_id)
            if http_method == "PATCH":
                return contact.update_message_status(event, message_id)
    except PermissionError:
        return error("FORBIDDEN", "User does not have permission.", 403)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
