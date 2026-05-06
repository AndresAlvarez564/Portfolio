# example.py — business logic for the example domain
# Each function maps to one API operation.

import json

def list_items(event):
    # TODO: implement
    return {
        "statusCode": 200,
        "body": json.dumps({"data": []})
    }
