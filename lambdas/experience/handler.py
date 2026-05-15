# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import re
from routes import experience
from utils.response import error


def lambda_handler(event, context):
    try:
        return _route(event)
    except PermissionError:
        return error("FORBIDDEN", "User does not have permission.", 403)


def _route(event):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /experience — public
    if http_method == "GET" and path == "/experience":
        return experience.list_experience(event)

    # POST /experience — admin only
    if http_method == "POST" and path == "/experience":
        return experience.create_experience(event)

    # PATCH /experience/reorder — admin only (must be before /{id})
    if http_method == "PATCH" and path == "/experience/reorder":
        return experience.reorder_experience(event)

    # PUT /experience/{id} — admin only
    # DELETE /experience/{id} — admin only
    match = re.match(r"^/experience/([^/]+)$", path)
    if match:
        experience_id = match.group(1)
        if http_method == "PUT":
            return experience.update_experience(event, experience_id)
        if http_method == "DELETE":
            return experience.delete_experience(event, experience_id)

    return error("NOT_FOUND", "Route not found.", 404)
