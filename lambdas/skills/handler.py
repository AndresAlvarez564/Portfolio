# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
import re
from routes import skills


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /skills — public (visible only)
    if http_method == "GET" and path == "/skills":
        return skills.list_skills(event)

    # POST /skills — admin only
    if http_method == "POST" and path == "/skills":
        return skills.create_skill(event)

    # PUT /skills/{id} — admin only
    # DELETE /skills/{id} — admin only
    match = re.match(r"^/skills/([^/]+)$", path)
    if match:
        skill_id = match.group(1)
        if http_method == "PUT":
            return skills.update_skill(event, skill_id)
        if http_method == "DELETE":
            return skills.delete_skill(event, skill_id)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
