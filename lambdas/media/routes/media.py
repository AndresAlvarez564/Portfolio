# media.py — route handlers for the media domain
# Business logic will be implemented in Phase 2 feature tickets.

from utils.response import success, error
from utils.auth import require_group


def list_media(event):
    """GET /media — admin only. Returns all media files."""
    require_group(event, "admin")
    # TODO: implement — query GSI-1 gsi1pk=MEDIA sort by gsi1sk
    return success([])


def request_upload_url(event):
    """POST /media/upload — admin only. Generates a pre-signed S3 upload URL."""
    require_group(event, "admin")
    # TODO: implement — validate body (filename, contentType, context),
    #                    generate S3 pre-signed URL valid for 5 minutes,
    #                    return { uploadUrl, s3Key }
    return success({})


def confirm_upload(event):
    """POST /media/confirm — admin only. Saves media metadata after S3 upload."""
    require_group(event, "admin")
    # TODO: implement — validate body (s3Key, mediaType, relatedId),
    #                    save MEDIA record to DynamoDB,
    #                    return media record with CloudFront URL
    return success({}, status_code=201)


def delete_media(event, media_id):
    """DELETE /media/{id} — admin only. Deletes media record and S3 object."""
    require_group(event, "admin")
    # TODO: implement — GetItem to get s3Key, delete from S3, DeleteItem from DynamoDB
    return success(None, status_code=204)
