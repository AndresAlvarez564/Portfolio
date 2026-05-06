# handler.py — routes requests to the correct route function
# This file should only contain routing logic, not business logic.

import json
from routes import example

def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    if http_method == "GET" and path == "/example":
        return example.list_items(event)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}})
    }
