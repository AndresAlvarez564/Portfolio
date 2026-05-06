# auth.py — authorization helpers
# Use these functions to extract and validate user claims from the Cognito token.

def get_user_groups(event):
    """Extract Cognito groups from the request context."""
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    groups = claims.get("cognito:groups", "")
    return groups.split(",") if groups else []

def require_group(event, group):
    """Raise an exception if the user is not in the required group."""
    if group not in get_user_groups(event):
        raise PermissionError(f"User is not in group: {group}")
