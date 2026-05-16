from routes.email_worker import process_record


def lambda_handler(event, context):
    failures = []

    for record in event.get("Records", []):
        try:
            process_record(record)
        except Exception:
            message_id = record.get("messageId")
            if message_id:
                failures.append({"itemIdentifier": message_id})
            else:
                raise

    return {"batchItemFailures": failures}
