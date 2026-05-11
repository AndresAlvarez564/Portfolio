# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
import re
from routes import projects, case_study


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    # GET /projects — public (published only)
    if http_method == "GET" and path == "/projects":
        return projects.list_projects(event)

    # POST /projects — admin only
    if http_method == "POST" and path == "/projects":
        return projects.create_project(event)

    # GET /projects/admin — admin only (all statuses)
    if http_method == "GET" and path == "/projects/admin":
        return projects.list_projects_admin(event)

    # Routes with /{slug} or /{id}
    match_base = re.match(r"^/projects/([^/]+)$", path)
    if match_base:
        slug_or_id = match_base.group(1)
        if http_method == "GET":
            return projects.get_project_by_slug(event, slug_or_id)
        if http_method == "PUT":
            return projects.update_project(event, slug_or_id)
        if http_method == "DELETE":
            return projects.delete_project(event, slug_or_id)
        if http_method == "PATCH":
            return projects.patch_project(event, slug_or_id)

    # GET /projects/{id}/admin — admin only
    match_admin = re.match(r"^/projects/([^/]+)/admin$", path)
    if match_admin and http_method == "GET":
        return projects.get_project_admin(event, match_admin.group(1))

    # GET /projects/{id}/case-study — admin only
    # PUT /projects/{id}/case-study — admin only
    match_case = re.match(r"^/projects/([^/]+)/case-study$", path)
    if match_case:
        project_id = match_case.group(1)
        if http_method == "GET":
            return case_study.get_case_study(event, project_id)
        if http_method == "PUT":
            return case_study.upsert_case_study(event, project_id)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
