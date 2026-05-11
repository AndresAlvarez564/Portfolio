# auth.py — authorization helpers


def get_user_groups(event):
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    groups = claims.get("cognito:groups", "")
    return groups.split(",") if groups else []


def require_group(event, group):
    if group not in get_user_groups(event):
        raise PermissionError(f"User is not in group: {group}")
