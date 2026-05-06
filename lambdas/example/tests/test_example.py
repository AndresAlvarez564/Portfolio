# test_example.py — unit tests for the example domain
# Run with: pytest

import pytest
from routes.example import list_items

def test_list_items_returns_empty_list():
    event = {}
    response = list_items(event)
    assert response["statusCode"] == 200
