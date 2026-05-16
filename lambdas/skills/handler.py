import json
import re

from routes import skills
from utils.response import error


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")

        if http_method == "GET" and path == "/skills":
            return skills.list_skills(event)

        if http_method == "GET" and path == "/skills/admin":
            return skills.list_skills_admin(event)

        if http_method == "POST" and path == "/skills":
            return skills.create_skill(event)

        match = re.match(r"^/skills/([^/]+)$", path)
        if match:
            skill_id = match.group(1)
            if http_method == "PUT":
                return skills.update_skill(event, skill_id)
            if http_method == "DELETE":
                return skills.delete_skill(event, skill_id)
    except PermissionError:
        return error("FORBIDDEN", "User does not have permission.", 403)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
