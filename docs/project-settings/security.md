# Security Model

> Status: Complete
> Assigned ticket: TK-04

---

## Overview

This document defines the authentication and authorization model for the Portfolio CRM. It covers Cognito configuration, route classification (public vs protected), Lambda-level authorization checks, and the token validation strategy.

There are two roles in this system:

| Role | Description |
|---|---|
| `public` | Any visitor — no authentication required |
| `admin` | Andres — authenticated via Cognito, member of the `admin` Cognito group |

---

## Cognito Configuration

### User Pool

| Setting | Value |
|---|---|
| Name | `portfolio-<stage>-user-pool` |
| Self sign-up | **Disabled** — only Andres can have an account |
| Login method | Email |
| Password policy | Minimum 8 characters, uppercase, lowercase, number, symbol |
| MFA | Optional in dev, recommended in prod |
| Account recovery | Email-based |
| Token validity | ID token: 1 hour, Refresh token: 30 days |

### App Client

| Setting | Value |
|---|---|
| Name | `portfolio-<stage>-client` |
| Auth flows | `USER_PASSWORD_AUTH` |
| Token used for API auth | ID token |
| Hosted UI | Not used — custom React login page |

### Cognito Groups

| Group | Members | Purpose |
|---|---|---|
| `admin` | Andres | Full access to admin panel and all protected API endpoints |

**Rules:**
- Only one user exists in the system: Andres.
- Andres must be manually added to the `admin` group after account creation.
- No self-registration is allowed.
- The frontend reads the `cognito:groups` claim from the ID token to determine role.
- The backend validates group membership on every protected request.

---

## Route Classification

### Public Routes (no authentication required)

These routes are accessible by any visitor without a token.

#### Frontend Routes

| Route | Description |
|---|---|
| `/` | Homepage |
| `/projects` | All published projects |
| `/projects/:slug` | Project detail and case study |
| `/experience` | Experience page |
| `/skills` | Skills page |
| `/certifications` | Certifications page |
| `/about` | About page |
| `/contact` | Contact form |
| `/admin/login` | Admin login page |

#### API Endpoints (no Cognito Authorizer)

| Method | Path | Description |
|---|---|---|
| `GET` | `/profile` | Get public profile settings |
| `GET` | `/projects` | List published projects (query param: `?featured=true`) |
| `GET` | `/projects/{slug}` | Get project detail by slug (published only) |
| `GET` | `/experience` | List all experience entries |
| `GET` | `/skills` | List visible skills |
| `GET` | `/certifications` | List all certifications |
| `POST` | `/contact` | Submit contact form |

**Notes:**
- `GET /projects` returns only `status = published` items for public callers.
- `GET /projects/{slug}` returns 404 if the project is not published.
- `POST /contact` has spam protection (honeypot, rate limit, length validation) but no auth.

---

### Protected Routes (authentication required)

These routes require a valid Cognito ID token in the `Authorization` header. API Gateway validates the token using a Cognito Authorizer before the request reaches Lambda.

#### Frontend Routes

| Route | Description |
|---|---|
| `/admin` | Redirects to `/admin/dashboard` if authenticated |
| `/admin/dashboard` | Admin dashboard |
| `/admin/projects` | Project list (all statuses) |
| `/admin/projects/create` | Create project form |
| `/admin/projects/:id/edit` | Edit project form |
| `/admin/experience` | Experience management |
| `/admin/skills` | Skills management |
| `/admin/certifications` | Certifications management |
| `/admin/media` | Media library |
| `/admin/messages` | Contact messages |
| `/admin/settings` | Profile settings |

#### API Endpoints (Cognito Authorizer required)

| Method | Path | Description | Group required |
|---|---|---|---|
| `PUT` | `/profile` | Update profile settings | `admin` |
| `GET` | `/projects/admin` | List all projects including drafts | `admin` |
| `GET` | `/projects/{id}/admin` | Get project by ID (draft or published) | `admin` |
| `POST` | `/projects` | Create project | `admin` |
| `PUT` | `/projects/{id}` | Update project | `admin` |
| `DELETE` | `/projects/{id}` | Delete project | `admin` |
| `PATCH` | `/projects/{id}` | Update project status or featured flag | `admin` |
| `GET` | `/projects/{id}/case-study` | Get case study | `admin` |
| `PUT` | `/projects/{id}/case-study` | Create or update case study | `admin` |
| `POST` | `/experience` | Create experience entry | `admin` |
| `PUT` | `/experience/{id}` | Update experience entry | `admin` |
| `DELETE` | `/experience/{id}` | Delete experience entry | `admin` |
| `PATCH` | `/experience/reorder` | Reorder experience entries | `admin` |
| `POST` | `/skills` | Create skill | `admin` |
| `PUT` | `/skills/{id}` | Update skill | `admin` |
| `DELETE` | `/skills/{id}` | Delete skill | `admin` |
| `POST` | `/certifications` | Create certification | `admin` |
| `PUT` | `/certifications/{id}` | Update certification | `admin` |
| `DELETE` | `/certifications/{id}` | Delete certification | `admin` |
| `POST` | `/media/upload` | Request pre-signed S3 upload URL | `admin` |
| `POST` | `/media/confirm` | Confirm upload and save media metadata | `admin` |
| `GET` | `/media` | List all media files | `admin` |
| `DELETE` | `/media/{id}` | Delete media file | `admin` |
| `GET` | `/contact` | List contact messages | `admin` |
| `GET` | `/contact/{id}` | Get contact message by ID | `admin` |
| `PATCH` | `/contact/{id}` | Update message status | `admin` |

---

## Token Validation Strategy

### API Gateway — Cognito Authorizer

All protected endpoints use a **Cognito Authorizer** attached to the API Gateway. This is the first line of defense.

**How it works:**
1. Client sends request with `Authorization: Bearer <id-token>` header.
2. API Gateway validates the token signature against the Cognito User Pool JWKS endpoint.
3. API Gateway checks token expiration.
4. If valid, API Gateway passes the decoded claims to Lambda in the `requestContext.authorizer.claims` object.
5. If invalid or missing, API Gateway returns `401 Unauthorized` before Lambda is invoked.

**Configuration:**
```text
Authorizer type: COGNITO_USER_POOLS
Identity source: method.request.header.Authorization
Token validation: Automatic (API Gateway handles signature + expiration)
```

### Lambda — Group Membership Check

API Gateway only validates that the token is authentic and not expired. It does **not** check Cognito group membership. Every protected Lambda must perform a second check.

**Required check in every admin Lambda:**

```python
def require_admin(claims: dict) -> None:
    groups = claims.get("cognito:groups", [])
    if "admin" not in groups:
        raise ForbiddenError("You do not have permission to perform this action.")
```

**Where claims come from:**

```python
def handler(event, context):
    claims = event["requestContext"]["authorizer"]["claims"]
    require_admin(claims)
    # proceed with business logic
```

**Rules:**
- Every admin Lambda must call `require_admin(claims)` before any business logic.
- Never trust the frontend to enforce authorization.
- Never skip the group check because "only Andres knows the password" — the check must be in code.
- If the group check fails, return `403 Forbidden` with `error.code = "FORBIDDEN"`.

---

## Authorization Rules by Entity

| Entity | Public read | Admin read | Admin write |
|---|---|---|---|
| `PROFILE_SETTINGS` | ✅ (sanitized fields only) | ✅ (all fields) | ✅ |
| `PROJECT` | ✅ (published only) | ✅ (all) | ✅ |
| `CASE_STUDY` | ✅ (if project is published) | ✅ | ✅ |
| `EXPERIENCE` | ✅ | ✅ | ✅ |
| `SKILL` | ✅ (visible only) | ✅ (all) | ✅ |
| `CERTIFICATION` | ✅ | ✅ | ✅ |
| `MEDIA` | ✅ (via CloudFront URL) | ✅ | ✅ |
| `CONTACT_MESSAGE` | ❌ (write only via POST /contact) | ✅ | ✅ |

**Notes on public reads:**
- `PROFILE_SETTINGS` public response must exclude `email` and internal fields.
- `PROJECT` public response must exclude draft projects.
- `SKILL` public response must exclude hidden skills.
- `CONTACT_MESSAGE` is write-only for public users — visitors can submit but never read messages.

---

## Frontend Authorization

The frontend uses the `cognito:groups` claim from the ID token to control UI visibility.

**AuthContext responsibilities:**
- Store the current user session (tokens, user info, group membership).
- Expose `isAuthenticated` and `isAdmin` flags.
- Redirect unauthenticated users from `/admin/*` routes to `/admin/login`.
- Redirect authenticated non-admin users with an unauthorized message.

**Rules:**
- Frontend role checks are for UI only — they hide or show elements.
- Frontend role checks are **not** real authorization — the backend enforces access.
- Never store the raw ID token in a place accessible to third-party scripts.
- Use Amplify's built-in token storage (localStorage by default).
- On token expiration, Amplify automatically refreshes using the refresh token.

**Protected route pattern:**

```tsx
// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  if (!isAdmin) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
};
```

---

## Security Checklist

| Rule | Status |
|---|---|
| Self sign-up disabled in Cognito | ✅ Defined |
| Admin group required for all write operations | ✅ Defined |
| API Gateway Cognito Authorizer on all protected endpoints | ✅ Defined |
| Lambda group membership check on all admin handlers | ✅ Defined |
| Public endpoints return only safe, filtered data | ✅ Defined |
| No secrets committed to the repository | ✅ Rule enforced |
| No AWS account IDs or resource names in public responses | ✅ Rule enforced |
| Frontend role checks are UI-only, not real authorization | ✅ Defined |
| HTTPS enforced via CloudFront | ✅ Defined in architecture |
| S3 bucket is private, CloudFront is the only entry point | ✅ Defined in architecture |
| Contact form spam protection (honeypot, rate limit) | ✅ Defined in flows |

---

**Last Updated:** 2026-05-11
**Status:** Complete
**Next:** TK-05 (CDK infrastructure setup)
