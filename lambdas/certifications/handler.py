import json
import re

from routes import certifications
from utils.response import error


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")

        if http_method == "GET" and path == "/certifications":
            return certifications.list_certifications(event)

        if http_method == "POST" and path == "/certifications":
            return certifications.create_certification(event)

        match = re.match(r"^/certifications/([^/]+)$", path)
        if match:
            certification_id = match.group(1)
            if http_method == "PUT":
                return certifications.update_certification(event, certification_id)
            if http_method == "DELETE":
                return certifications.delete_certification(event, certification_id)
    except PermissionError:
        return error("FORBIDDEN", "User does not have permission.", 403)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
