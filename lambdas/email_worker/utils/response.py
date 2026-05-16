import json


def success(data=None):
    return {"statusCode": 200, "body": json.dumps({"data": data})}
