import importlib.util
import json
import os
from pathlib import Path

import boto3
import pytest
from moto import mock_aws

os.environ["SES_FROM_EMAIL"] = "andres@example.com"
os.environ["SES_TO_EMAIL"] = "andres@example.com"
os.environ["LOG_LEVEL"] = "DEBUG"

from routes.email_worker import process_record


def _record(**overrides):
    body = {
        "messageId": "msg-1",
        "name": "Jane",
        "email": "jane@example.com",
        "company": "Acme",
        "projectType": "Web app",
        "budget": "$5k",
        "subject": "Project inquiry",
        "message": "Can we talk?",
    }
    body.update(overrides)
    return {"messageId": body.get("messageId", "msg-1"), "body": json.dumps(body)}


def _load_handler_module():
    path = Path(__file__).resolve().parents[1] / "handler.py"
    spec = importlib.util.spec_from_file_location("email_worker_handler_under_test", path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


@mock_aws
def test_process_record_sends_email_via_ses():
    ses = boto3.client("ses", region_name="us-east-1")
    ses.verify_email_identity(EmailAddress="andres@example.com")

    process_record(_record())

    sent = ses.get_send_statistics()["SendDataPoints"]
    assert len(sent) == 1


def test_process_record_invalid_body_raises_exception():
    with pytest.raises(ValueError):
        process_record({"messageId": "bad", "body": "{not-json"})


def test_handler_processes_all_records(monkeypatch):
    handler = _load_handler_module()
    processed = []

    def fake_process(record):
        processed.append(record["messageId"])

    monkeypatch.setattr(handler, "process_record", fake_process)

    response = handler.lambda_handler({"Records": [
        {"messageId": "one", "body": "{}"},
        {"messageId": "two", "body": "{}"},
    ]}, None)

    assert processed == ["one", "two"]
    assert response == {"batchItemFailures": []}
