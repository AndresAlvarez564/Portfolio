# response.py — standard response helpers
# Use these functions to ensure consistent response shape across all routes.

import json


def success(data, status_code=200):
    return {
        "statusCode": status_code,
        "body": json.dumps({"data": data}),
    }


def error(code, message, status_code=400):
    return {
        "statusCode": status_code,
        "body": json.dumps({"error": {"code": code, "message": message}}),
    }
