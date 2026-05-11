# response.py — standard response helpers

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
