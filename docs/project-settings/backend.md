# Backend

> Status: Initial draft — update as Lambda modules are implemented in Phase 2.
> Assigned ticket: TK-16 (initial draft)

---

## Overview

The backend is a set of Python 3.12 Lambda functions, one per business domain. Each function handles all routes for its domain. There is no shared runtime or monolithic handler — each Lambda is deployed, versioned, and monitored independently.

All Lambda functions are deployed via CodeDeploy using the `live` alias. API Gateway always calls the `live` alias, never `$LATEST`.

---

## Lambda Modules

| Function name | Domain | Routes handled |
|---|---|---|
| `portfolio-<stage>-profile` | Profile settings | `GET /profile`, `PUT /profile` |
| `portfolio-<stage>-projects` | Projects and case studies | `GET/POST /projects`, `GET/PUT/DELETE/PATCH /projects/{slug}`, `GET /projects/admin`, `GET /projects/{id}/admin`, `GET/PUT /projects/{id}/case-study` |
| `portfolio-<stage>-experience` | Experience entries | `GET/POST /experience`, `PATCH /experience/reorder`, `PUT/DELETE /experience/{id}` |
| `portfolio-<stage>-skills` | Skills | `GET/POST /skills`, `GET /skills/admin`, `PUT/DELETE /skills/{id}` |
| `portfolio-<stage>-certifications` | Certifications | `GET/POST /certifications`, `PUT/DELETE /certifications/{id}` |
| `portfolio-<stage>-media` | Media uploads | `GET /media`, `POST /media/upload`, `POST /media/confirm`, `DELETE /media/{id}` |
| `portfolio-<stage>-contact` | Contact messages | `POST /contact`, `GET /contact`, `GET/PATCH /contact/{id}` |

---

## Folder Structure

Each Lambda follows the same structure:

```text
lambdas/<domain>/
├── conftest.py          # pytest sys.path setup — required for CodeBuild test runner
├── handler.py           # Entry point — routing only, no business logic
├── routes/
│   └── <domain>.py      # Route handler functions
├── utils/
│   ├── auth.py          # Authorization helpers
│   └── response.py      # Standard response helpers
└── tests/
    └── test_<domain>.py # Unit tests
```

The `projects` domain has an additional route file:

```text
lambdas/projects/
├── routes/
│   ├── projects.py      # Project CRUD and listing
│   └── case_study.py    # Case study get and upsert
```

---

## handler.py Pattern

`handler.py` is the Lambda entry point. It reads `httpMethod` and `path` from the API Gateway event and dispatches to the correct route function. It contains no business logic.

```python
def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path = event.get("path", "")

    if http_method == "GET" and path == "/profile":
        return profile.get_profile(event)

    if http_method == "PUT" and path == "/profile":
        return profile.update_profile(event)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": {"code": "NOT_FOUND", "message": "Route not found."}}),
    }
```

For routes with path parameters, `re.match` extracts the ID or slug:

```python
match = re.match(r"^/projects/([^/]+)$", path)
if match:
    slug_or_id = match.group(1)
    if http_method == "GET":
        return projects.get_project_by_slug(event, slug_or_id)
```

Rules:
- Static paths (e.g. `/projects/admin`) must be matched before dynamic paths (e.g. `/projects/{slug}`) to avoid false matches.
- `handler.py` never touches DynamoDB, S3, or any AWS service directly.

---

## routes/ Pattern

Route files contain the business logic. Each function receives the full API Gateway `event` and returns a standard response dict.

```python
from utils.response import success, error
from utils.auth import require_group

def get_profile(event):
    """GET /profile — public. Returns sanitized profile settings."""
    # TODO: query DynamoDB pk=PROFILE sk=SETTINGS, exclude sensitive fields
    return success({})

def update_profile(event):
    """PUT /profile — admin only."""
    require_group(event, "admin")
    # TODO: validate body, update DynamoDB
    return success({})
```

Rules:
- Every admin route must call `require_group(event, "admin")` as the first line.
- Never skip the group check — API Gateway validates the token, but not the group.
- Return `success(data)` on success, `error(code, message, status_code)` on failure.
- Never return raw exceptions or stack traces in the response body.

---

## utils/auth.py

Extracts Cognito group membership from the API Gateway request context and enforces it.

```python
def get_user_groups(event):
    """Extract Cognito groups from the request context."""
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    groups = claims.get("cognito:groups", "")
    return groups.split(",") if groups else []

def require_group(event, group):
    """Raise a PermissionError if the user is not in the required group."""
    if group not in get_user_groups(event):
        raise PermissionError(f"User is not in group: {group}")
```

How claims reach the Lambda:
1. Frontend sends `Authorization: Bearer <id-token>` header.
2. API Gateway validates the token with the Cognito Authorizer.
3. API Gateway injects decoded claims into `event["requestContext"]["authorizer"]["claims"]`.
4. Lambda reads `cognito:groups` from claims.

If `require_group` raises `PermissionError`, the route handler must catch it and return a `403` response. This will be standardized in Phase 2 with a shared exception handler.

---

## utils/response.py

Ensures every Lambda returns the same response shape.

```python
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
```

Success shape:
```json
{ "data": { ... } }
```

Error shape:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "The title field is required." } }
```

---

## Environment Variables

Every Lambda receives these environment variables at runtime:

| Variable | Value | Purpose |
|---|---|---|
| `STAGE` | `dev` / `staging` / `prod` | Current environment |
| `TABLE_NAME` | DynamoDB table name | Main table for all entities |
| `LOG_LEVEL` | `DEBUG` (dev/staging) / `WARNING` (prod) | Logging verbosity |
| `POWERTOOLS_SERVICE_NAME` | `portfolio-<domain>` | Lambda Powertools service name |

The `media` Lambda also receives:

| Variable | Value | Purpose |
|---|---|---|
| `MEDIA_BUCKET_NAME` | S3 bucket name | Target bucket for pre-signed URL generation |

---

## Error Handling

Standard HTTP status codes used across all routes:

| Code | When to use |
|---|---|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST that creates a resource |
| `400` | Invalid input, missing required fields, business rule violation |
| `401` | Not authenticated — missing or invalid token (handled by API Gateway) |
| `403` | Authenticated but not in the required Cognito group |
| `404` | Resource not found |
| `409` | Conflict — duplicate slug, uniqueness violation |
| `500` | Unexpected server error |

Standard error codes:

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Missing or invalid input field |
| `NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RECORD` | Uniqueness rule violated (e.g. duplicate slug) |
| `FORBIDDEN` | User does not have permission |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Testing

Tests live inside each Lambda's `tests/` folder and run in CodeBuild via:

```bash
cd lambdas && pytest --tb=short -q
```

Each Lambda has a `conftest.py` at its root that adds the Lambda directory to `sys.path`, allowing `from routes.profile import ...` to resolve correctly when pytest runs from the `lambdas/` directory.

Current test coverage (Phase 1 — placeholder tests):
- Public routes return `200`
- All admin routes raise `PermissionError` when called without the `admin` group

Phase 2 feature tickets will add real business logic tests using `moto` to mock DynamoDB.

Test dependencies are in `lambdas/requirements-dev.txt`:

```text
pytest==8.3.5
moto[dynamodb]==5.1.5
boto3==1.38.0
```

---

## Business Rules

Business logic will be implemented in Phase 2 feature tickets. Key rules to enforce in each domain:

| Domain | Key rules |
|---|---|
| `profile` | Public response must exclude `email` and internal fields |
| `projects` | Public response returns only `status = published` items; slug must be unique |
| `experience` | Ordered by `order` field; reorder updates `gsi1sk` for all affected items |
| `skills` | Public response returns only `visibility = visible` items |
| `certifications` | No special filtering — all certifications are public |
| `media` | Pre-signed URL valid for 5 minutes; CV upload replaces previous CV in `PROFILE_SETTINGS` |
| `contact` | Honeypot field must be empty; rate limit by IP; message length limits apply |

---

## Projects Module

`lambdas/projects/routes/projects.py` implements project CRUD against DynamoDB `PROJECT` items.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `GET` | `/projects` | Public | Queries `gsi1` for `STATUS#published#` and returns published projects only |
| `GET` | `/projects/{slug}` | Public | Queries `gsi3` by `SLUG#<slug>` and returns `404` for drafts or missing projects |
| `GET` | `/projects/admin` | Admin | Queries `gsi1` for all project statuses |
| `GET` | `/projects/{id}/admin` | Admin | Gets `PROJECT#<id> / METADATA` |
| `POST` | `/projects` | Admin | Validates input, generates `projectId` and unique slug, writes project item |
| `PUT` | `/projects/{id}` | Admin | Replaces editable metadata and refreshes GSI keys |
| `DELETE` | `/projects/{id}` | Admin | Deletes the project metadata item |
| `PATCH` | `/projects/{id}` | Admin | Updates `status`, `featured`, or `featuredOrder` |
| `GET` | `/projects/{id}/case-study` | Public | Gets the optional case study item; returns `{}` when missing |
| `PUT` | `/projects/{id}/case-study` | Admin | Creates or replaces the case study item |

Slug uniqueness is enforced in Lambda by querying `gsi3`. Conflicts append `-2`, `-3`, and so on while keeping the slug within 80 characters.

GSI key update pattern:

| Field changed | Key updated |
|---|---|
| `status` | `gsi1sk = STATUS#<status>#<createdAt>` |
| `featured` / `featuredOrder` | `gsi2sk = FEATURED#<true|false>#<order>` |

Project mutations log structured events for create, delete, and patch operations.

Case studies are stored separately with `pk = PROJECT#<id>` and `sk = CASE_STUDY`. Upsert uses `PutItem` as a full replace and requires `problem`, `solution`, and `architecture`; `challenges` and `results` are optional. The public get route returns `{}` when a project has no case study because case studies are optional.

---

## Experience Module

`lambdas/experience/routes/experience.py` implements ordered experience entries.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `GET` | `/experience` | Public | Queries `gsi1pk = EXPERIENCE`, sorted by `gsi1sk` |
| `POST` | `/experience` | Admin | Validates input, assigns `order = count + 1`, creates an entry |
| `PUT` | `/experience/{id}` | Admin | Replaces editable entry fields |
| `DELETE` | `/experience/{id}` | Admin | Deletes the entry |
| `PATCH` | `/experience/reorder` | Admin | Receives `orderedIds` and updates `order` plus `gsi1sk` |

Reorder stores display order as a 1-based number and `gsi1sk = ORDER#<padded>`, for example `ORDER#001`.

---

## Skills Module

`lambdas/skills/routes/skills.py` implements skills CRUD against DynamoDB `SKILL` items.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `GET` | `/skills` | Public | Queries `gsi1pk = SKILL` with `gsi1sk` beginning `VISIBILITY#visible` |
| `GET` | `/skills/admin` | Admin | Queries all skills, including hidden entries |
| `POST` | `/skills` | Admin | Validates input, generates `skillId`, creates a skill |
| `PUT` | `/skills/{id}` | Admin | Replaces editable fields and refreshes `gsi1sk` |
| `DELETE` | `/skills/{id}` | Admin | Deletes the skill metadata item |

Required fields are `name`, `category`, and `visibility`. Allowed categories are `cloud`, `backend`, `frontend`, `devops`, and `databases`; allowed visibility values are `visible` and `hidden`.

Skills use `gsi1pk = SKILL` and `gsi1sk = VISIBILITY#<visibility>#<category>`. The public route enforces the visibility filter in Lambda so hidden entries are never returned to public visitors.

---

## Certifications Module

`lambdas/certifications/routes/certifications.py` implements certification CRUD against DynamoDB `CERTIFICATION` items.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `GET` | `/certifications` | Public | Queries `gsi1pk = CERTIFICATION`, sorted by newest issue date first |
| `POST` | `/certifications` | Admin | Validates input, generates `certificationId`, creates a certification |
| `PUT` | `/certifications/{id}` | Admin | Replaces editable fields and refreshes `gsi1sk` |
| `DELETE` | `/certifications/{id}` | Admin | Deletes the certification metadata item |

Required fields are `name`, `issuer`, and `issueDate`. `issueDate` must use `YYYY-MM`; `expirationDate` is optional but must use `YYYY-MM` when present.

Certifications use `gsi1pk = CERTIFICATION` and `gsi1sk = ISSUE_DATE#<issueDate>#CERTIFICATION#<id>`. The public route reads all certifications with `ScanIndexForward = False`, so the newest credentials are returned first.

---

## Contact Module

`lambdas/contact/routes/contact.py` implements contact form submission and admin message management.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `POST` | `/contact` | Public | Validates honeypot and form fields, stores a message, sends an SQS notification |
| `GET` | `/contact` | Admin | Lists messages sorted newest first; supports `?status=unread|read|archived` |
| `GET` | `/contact/{id}` | Admin | Gets one contact message |
| `PATCH` | `/contact/{id}` | Admin | Updates message status and refreshes `gsi1sk` |

The public submit route silently returns `200` when the honeypot field (`website` or `honeypot`) is filled. Required fields are `name`, `email`, `subject`, and `message`; `message` is limited to 2000 characters.

Contact messages use `gsi1pk = CONTACT` and `gsi1sk = CREATED#<createdAt>#STATUS#<status>#MESSAGE#<id>`. Status values are `unread`, `read`, and `archived`.

The contact Lambda receives `CONTACT_QUEUE_URL` and sends the saved message to SQS for the async email worker.

---

## Media Module

`lambdas/media/routes/media.py` implements direct browser uploads to the private media S3 bucket using pre-signed PUT URLs.

Routes:

| Method | Path | Access | Behavior |
|---|---|---|---|
| `POST` | `/media/upload` | Admin | Validates file metadata and returns a 5-minute pre-signed S3 PUT URL |
| `POST` | `/media/confirm` | Admin | Verifies the S3 object exists, saves a media record, returns `cloudfrontUrl` |
| `GET` | `/media` | Admin | Lists all media records newest first |
| `DELETE` | `/media/{id}` | Admin | Deletes the S3 object and DynamoDB media record |

Allowed content types are `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, and `application/pdf`. Allowed contexts are `project-screenshot`, `project-thumbnail`, `certification-badge`, `cv`, and `diagram`.

Media records use `gsi1pk = MEDIA` and `gsi1sk = CREATED#<createdAt>#CONTEXT#<context>#MEDIA#<id>`. The media Lambda receives `MEDIA_BUCKET_NAME` and `CLOUDFRONT_MEDIA_URL`; public URLs are constructed as `<CLOUDFRONT_MEDIA_URL>/<s3Key>`.

When `context = cv`, confirm upload also updates `PROFILE / SETTINGS` with `cvFileUrl` and `cvS3Key`. Old CV objects are not deleted during replacement.

---

**Last Updated:** 2026-05-11
**Status:** Initial draft
**Next:** Update this document as Phase 2 feature tickets are implemented
