# contact.py — route handlers for the contact domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def submit_contact(event):
    """POST /contact — public. Validates and saves a contact form submission."""
    # TODO: implement — validate honeypot, rate limit by IP, validate fields,
    #                    PutItem CONTACT_MESSAGE, send to SQS queue
    return success({})


def list_messages(event):
    """GET /contact — admin only. Returns all contact messages ordered by date."""
    require_group(event, "admin")
    # TODO: implement — query GSI-1 gsi1pk=CONTACT sort by gsi1sk desc
    return success([])


def get_message(event, message_id):
    """GET /contact/{id} — admin only. Returns a single contact message."""
    require_group(event, "admin")
    # TODO: implement — GetItem pk=CONTACT#<id> sk=MESSAGE
    return success({})


def update_message_status(event, message_id):
    """PATCH /contact/{id} — admin only. Updates message status (read/archived)."""
    require_group(event, "admin")
    # TODO: implement — validate status value, UpdateItem pk=CONTACT#<id> sk=MESSAGE,
    #                    update status + gsi1sk
    return success({})
