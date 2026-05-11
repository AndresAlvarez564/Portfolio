# User Flows and Business Processes

> Status: Complete
> Assigned ticket: TK-02

---

## Overview

This document maps every user flow and business process in the Portfolio CRM. It covers both the public portfolio site and the private admin panel. Each flow includes step-by-step actions, authorization requirements, and which entities are affected.

---

## Roles

| Role | Description |
|---|---|
| `public` | Any visitor — no authentication required |
| `admin` | Andres — authenticated via Cognito, member of the `admin` group |

---

## 1. Public Flows

### 1.1 Visit Homepage

**Auth required:** No

**Steps:**
1. Visitor navigates to `portfolio.example.com`
2. CloudFront serves the React SPA from S3
3. Frontend calls `GET /profile` to load profile settings (name, title, summary, social links)
4. Frontend calls `GET /projects?featured=true` to load featured projects
5. Frontend calls `GET /experience` to load experience preview
6. Frontend calls `GET /skills` to load skills preview
7. Frontend calls `GET /certifications` to load certifications preview
8. Page renders: hero, featured projects, experience preview, skills preview, certifications preview, contact CTA

**Error path:**
- If any API call fails, the section renders empty or with a fallback message
- No blocking error — partial content is acceptable

**Entities affected (read):** `PROFILE_SETTINGS`, `PROJECT` (featured + published only), `EXPERIENCE`, `SKILL`, `CERTIFICATION`

---

### 1.2 Browse All Projects

**Auth required:** No

**Steps:**
1. Visitor clicks "View Projects" or navigates to `/projects`
2. Frontend calls `GET /projects` (returns published projects only)
3. Page renders project cards with title, description, tech stack tags, and thumbnail
4. Visitor can filter by category/tag
5. Visitor can search by keyword

**Error path:**
- If API call fails, show error message with retry option
- If no projects exist, show empty state

**Entities affected (read):** `PROJECT` (published only)

---

### 1.3 View Project Detail / Case Study

**Auth required:** No

**Steps:**
1. Visitor clicks a project card
2. Frontend navigates to `/projects/:slug`
3. Frontend calls `GET /projects/:slug`
4. Page renders: overview, problem, solution, architecture, tech stack, screenshots, results, links
5. Screenshots are served via CloudFront from S3

**Error path:**
- If project not found (404), redirect to `/projects`
- If project is not published, return 404 (do not expose draft content)

**Entities affected (read):** `PROJECT`, `CASE_STUDY`, `MEDIA`

---

### 1.4 View Experience Page

**Auth required:** No

**Steps:**
1. Visitor navigates to `/experience`
2. Frontend calls `GET /experience`
3. Page renders all experience entries ordered by date (most recent first)

**Error path:**
- If API call fails, show error message

**Entities affected (read):** `EXPERIENCE`

---

### 1.5 View Skills Page

**Auth required:** No

**Steps:**
1. Visitor navigates to `/skills`
2. Frontend calls `GET /skills`
3. Page renders skills grouped by category (only visible skills)

**Error path:**
- If API call fails, show error message

**Entities affected (read):** `SKILL` (visible only)

---

### 1.6 View Certifications Page

**Auth required:** No

**Steps:**
1. Visitor navigates to `/certifications`
2. Frontend calls `GET /certifications`
3. Page renders certification cards with name, badge image, verification link, and expiration date

**Error path:**
- If API call fails, show error message

**Entities affected (read):** `CERTIFICATION`

---

### 1.7 View About Page

**Auth required:** No

**Steps:**
1. Visitor navigates to `/about`
2. Frontend calls `GET /profile` to load profile info
3. Page renders name, title, summary, location, social links, and CV download link

**Error path:**
- If API call fails, show error message

**Entities affected (read):** `PROFILE_SETTINGS`

---

### 1.8 Submit Contact Form

**Auth required:** No

**Steps:**
1. Visitor navigates to `/contact`
2. Visitor fills in: name, email, subject, message (optional: projectType, budget, company)
3. Frontend validates fields client-side (React Hook Form + Yup)
4. Frontend submits `POST /contact` with form data and honeypot field
5. Lambda validates input:
   - Honeypot field must be empty
   - Rate limit check by IP
   - Message length within limits
   - Required fields present and valid
6. Lambda saves message to DynamoDB with `status: unread`
7. Lambda sends message to SQS queue
8. Lambda returns `200 OK` to frontend
9. Frontend shows success confirmation message
10. SQS triggers email worker Lambda
11. Email worker sends notification to Andres via SES
12. If SES fails, message goes to Dead Letter Queue for retry

**Error paths:**
- Honeypot triggered → return `200 OK` silently (do not reveal spam detection)
- Rate limit exceeded → return `429 Too Many Requests`
- Validation error → return `400 Bad Request` with field errors
- SES failure → message stays in DLQ, Andres is not notified immediately but message is saved in DynamoDB

**Entities affected (write):** `CONTACT_MESSAGE`

---

### 1.9 Download CV

**Auth required:** No

**Steps:**
1. Visitor clicks "Download CV" on the About page or hero section
2. Frontend opens the CV file URL (served via CloudFront from S3)
3. Browser downloads the PDF

**Error path:**
- If file not found, show error message

**Entities affected (read):** `PROFILE_SETTINGS` (CV file URL), `MEDIA` (CV file in S3)

---

## 2. Admin Flows

### 2.1 Admin Login

**Auth required:** No (this flow establishes authentication)

**Steps:**
1. Andres navigates to `/admin`
2. Frontend detects no active session and redirects to `/admin/login`
3. Andres enters email and password
4. Frontend calls Cognito via AWS Amplify (`Auth.signIn`)
5. Cognito validates credentials
6. Cognito returns JWT tokens (ID token, access token, refresh token)
7. Amplify stores tokens in localStorage/sessionStorage
8. Frontend verifies user belongs to `admin` group (from ID token claims)
9. Frontend redirects to `/admin/dashboard`

**Error paths:**
- Invalid credentials → show error message, do not reveal whether email or password is wrong
- User not in admin group → deny access, show unauthorized message
- Account locked → show appropriate message from Cognito

**Entities affected:** None (Cognito handles auth state)

---

### 2.2 Admin Logout

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Logout"
2. Frontend calls Cognito `Auth.signOut` via Amplify
3. Amplify clears tokens from storage
4. Frontend redirects to `/admin/login`

**Entities affected:** None

---

### 2.3 View Admin Dashboard

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/dashboard`
2. Frontend calls `GET /projects` (all projects, including drafts)
3. Dashboard renders: total projects count, published count, draft count, featured count, recent updates

**Entities affected (read):** `PROJECT`

---

### 2.4 Create Project

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/projects`
2. Andres clicks "Create Project"
3. Frontend renders project creation form
4. Andres fills in: title, description, tech stack, problem, solution, architecture notes, links
5. Andres sets status to `draft` or `published`
6. Andres sets `featured` flag
7. Frontend submits `POST /projects` with JWT in Authorization header
8. API Gateway validates JWT with Cognito Authorizer
9. Lambda validates admin group membership from token claims
10. Lambda creates project record in DynamoDB with generated `projectId` and `slug`
11. Lambda returns created project
12. Frontend redirects to project edit page or project list

**Error paths:**
- JWT invalid or expired → `401 Unauthorized`, redirect to login
- User not in admin group → `403 Forbidden`
- Validation error → `400 Bad Request` with field errors
- Duplicate slug → Lambda generates a unique slug automatically

**Entities affected (write):** `PROJECT`

---

### 2.5 Edit Project

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/projects`
2. Andres clicks "Edit" on a project
3. Frontend calls `GET /projects/:id` (admin version, returns draft content)
4. Frontend renders pre-filled edit form
5. Andres modifies fields
6. Frontend submits `PUT /projects/:id` with JWT
7. API Gateway validates JWT
8. Lambda validates admin group membership
9. Lambda updates project record in DynamoDB
10. Lambda returns updated project
11. Frontend shows success message

**Error paths:**
- Project not found → `404 Not Found`
- JWT invalid → `401 Unauthorized`
- Not admin → `403 Forbidden`
- Validation error → `400 Bad Request`

**Entities affected (write):** `PROJECT`

---

### 2.6 Delete Project

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Delete" on a project
2. Frontend shows confirmation dialog
3. Andres confirms deletion
4. Frontend submits `DELETE /projects/:id` with JWT
5. Lambda validates admin group membership
6. Lambda deletes project record from DynamoDB
7. Lambda returns `204 No Content`
8. Frontend removes project from list

**Error paths:**
- Project not found → `404 Not Found`
- JWT invalid → `401 Unauthorized`
- Not admin → `403 Forbidden`

**Entities affected (write):** `PROJECT`

---

### 2.7 Toggle Project Publish Status

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Publish" or "Unpublish" on a project
2. Frontend submits `PATCH /projects/:id` with `{ status: "published" | "draft" }` and JWT
3. Lambda validates admin group membership
4. Lambda updates `status` field in DynamoDB
5. Frontend updates project card status indicator

**Entities affected (write):** `PROJECT`

---

### 2.8 Toggle Project Featured Status

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Feature" or "Unfeature" on a project
2. Frontend submits `PATCH /projects/:id` with `{ featured: true | false }` and JWT
3. Lambda validates admin group membership
4. Lambda updates `featured` field in DynamoDB
5. Frontend updates project card featured indicator

**Entities affected (write):** `PROJECT`

---

### 2.9 Upload Project Screenshots

**Auth required:** Yes (admin)

**Steps:**
1. Andres is on the project edit page
2. Andres selects one or more image files
3. Frontend calls `POST /media/upload` with `{ filename, contentType, context: "project-screenshot" }` and JWT
4. Lambda validates admin group membership
5. Lambda generates a pre-signed S3 URL (valid for 5 minutes)
6. Lambda returns pre-signed URL and S3 key
7. Frontend uploads file directly to S3 using the pre-signed URL
8. Frontend calls `POST /media/confirm` with `{ s3Key, projectId, mediaType: "screenshot" }` and JWT
9. Lambda saves media metadata to DynamoDB
10. Lambda returns media record with CloudFront URL
11. Frontend adds screenshot to project form

**Error paths:**
- File type not allowed → `400 Bad Request` (only images allowed)
- File too large → `400 Bad Request`
- Pre-signed URL expired → frontend must request a new one
- S3 upload fails → frontend shows error, user retries

**Entities affected (write):** `MEDIA`, `PROJECT` (screenshot references)

---

### 2.10 Manage Case Study

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to the case study editor for a project
2. Frontend calls `GET /projects/:id/case-study`
3. Andres edits: problem, solution, architecture, challenges, results
4. Frontend submits `PUT /projects/:id/case-study` with JWT
5. Lambda validates admin group membership
6. Lambda updates or creates case study record in DynamoDB
7. Frontend shows success message

**Entities affected (write):** `CASE_STUDY`

---

### 2.11 Create Experience Entry

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/experience`
2. Andres clicks "Add Role"
3. Andres fills in: company, title, start date, end date (or marks as current), description
4. Frontend submits `POST /experience` with JWT
5. Lambda validates admin group membership
6. Lambda creates experience record in DynamoDB
7. Frontend adds entry to list

**Entities affected (write):** `EXPERIENCE`

---

### 2.12 Edit Experience Entry

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Edit" on an experience entry
2. Frontend calls `GET /experience/:id`
3. Frontend renders pre-filled form
4. Andres modifies fields
5. Frontend submits `PUT /experience/:id` with JWT
6. Lambda updates record in DynamoDB
7. Frontend shows success message

**Entities affected (write):** `EXPERIENCE`

---

### 2.13 Delete Experience Entry

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Delete" on an experience entry
2. Frontend shows confirmation dialog
3. Andres confirms
4. Frontend submits `DELETE /experience/:id` with JWT
5. Lambda deletes record from DynamoDB
6. Frontend removes entry from list

**Entities affected (write):** `EXPERIENCE`

---

### 2.14 Reorder Experience Entries

**Auth required:** Yes (admin)

**Steps:**
1. Andres drags and drops experience entries to reorder them
2. Frontend submits `PATCH /experience/reorder` with `{ orderedIds: [...] }` and JWT
3. Lambda updates `order` field for each entry in DynamoDB
4. Frontend reflects new order

**Entities affected (write):** `EXPERIENCE`

---

### 2.15 Create Skill

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/skills`
2. Andres clicks "Add Skill"
3. Andres fills in: name, category, visibility (visible/hidden)
4. Frontend submits `POST /skills` with JWT
5. Lambda creates skill record in DynamoDB
6. Frontend adds skill to list

**Entities affected (write):** `SKILL`

---

### 2.16 Edit Skill

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Edit" on a skill
2. Frontend renders pre-filled form
3. Andres modifies fields
4. Frontend submits `PUT /skills/:id` with JWT
5. Lambda updates record in DynamoDB

**Entities affected (write):** `SKILL`

---

### 2.17 Delete Skill

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Delete" on a skill
2. Frontend shows confirmation dialog
3. Andres confirms
4. Frontend submits `DELETE /skills/:id` with JWT
5. Lambda deletes record from DynamoDB

**Entities affected (write):** `SKILL`

---

### 2.18 Create Certification

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/certifications`
2. Andres clicks "Add Certification"
3. Andres fills in: name, issuer, issue date, expiration date (optional), verification link
4. Andres uploads badge image (follows media upload flow — see 2.9)
5. Frontend submits `POST /certifications` with JWT
6. Lambda creates certification record in DynamoDB
7. Frontend adds certification to list

**Entities affected (write):** `CERTIFICATION`, `MEDIA` (badge image)

---

### 2.19 Edit Certification

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Edit" on a certification
2. Frontend renders pre-filled form
3. Andres modifies fields
4. Frontend submits `PUT /certifications/:id` with JWT
5. Lambda updates record in DynamoDB

**Entities affected (write):** `CERTIFICATION`

---

### 2.20 Delete Certification

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks "Delete" on a certification
2. Frontend shows confirmation dialog
3. Andres confirms
4. Frontend submits `DELETE /certifications/:id` with JWT
5. Lambda deletes record from DynamoDB

**Entities affected (write):** `CERTIFICATION`

---

### 2.21 Upload CV File

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/settings` or `/admin/media`
2. Andres selects a PDF file
3. Frontend calls `POST /media/upload` with `{ filename, contentType: "application/pdf", context: "cv" }` and JWT
4. Lambda generates pre-signed S3 URL
5. Frontend uploads PDF directly to S3
6. Frontend calls `POST /media/confirm` with `{ s3Key, mediaType: "cv" }` and JWT
7. Lambda saves media metadata to DynamoDB
8. Lambda updates `PROFILE_SETTINGS` with new CV file URL (replaces previous)
9. Frontend shows success message with new CV download link

**Business rule:** CV upload replaces the previous CV file. Only one active CV at a time.

**Entities affected (write):** `MEDIA`, `PROFILE_SETTINGS`

---

### 2.22 Manage Media Library

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/media`
2. Frontend calls `GET /media` to list all uploaded files
3. Andres can view, copy URL, or delete media files
4. To delete: frontend submits `DELETE /media/:id` with JWT
5. Lambda deletes media record from DynamoDB
6. Lambda deletes file from S3

**Entities affected (write):** `MEDIA`

---

### 2.23 Update Profile Settings

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/settings`
2. Frontend calls `GET /profile` to load current settings
3. Andres edits: name, title, summary, location, social links
4. Frontend submits `PUT /profile` with JWT
5. Lambda validates admin group membership
6. Lambda updates `PROFILE_SETTINGS` record in DynamoDB
7. Frontend shows success message

**Entities affected (write):** `PROFILE_SETTINGS`

---

### 2.24 View Contact Messages

**Auth required:** Yes (admin)

**Steps:**
1. Andres navigates to `/admin/messages` (future feature — not in MVP v1)
2. Frontend calls `GET /contact` with JWT
3. Lambda returns all contact messages ordered by date (most recent first)
4. Andres can filter by status: unread, read, archived

**Entities affected (read):** `CONTACT_MESSAGE`

---

### 2.25 Mark Contact Message as Read / Archived

**Auth required:** Yes (admin)

**Steps:**
1. Andres clicks on a message to open it
2. Frontend submits `PATCH /contact/:id` with `{ status: "read" }` and JWT
3. Lambda updates message status in DynamoDB
4. To archive: same flow with `{ status: "archived" }`

**Entities affected (write):** `CONTACT_MESSAGE`

---

## 3. System / Async Flows

### 3.1 Email Notification (SQS → Lambda → SES)

**Trigger:** Contact form submission (flow 1.8)

**Steps:**
1. Contact handler Lambda places message on SQS queue
2. SQS triggers email worker Lambda
3. Email worker reads message from queue
4. Email worker sends notification email to Andres via SES
5. On success: SQS deletes message from queue
6. On SES failure: message goes to Dead Letter Queue for retry

**Entities affected (read):** `CONTACT_MESSAGE`

---

### 3.2 Media Delivery via CloudFront

**Trigger:** Any page load that includes images, screenshots, or CV

**Steps:**
1. Frontend renders CloudFront URL for media file
2. Browser requests file from CloudFront edge
3. If cached: CloudFront returns file from edge cache
4. If not cached: CloudFront fetches from S3 via Origin Access Control
5. CloudFront caches file at edge for subsequent requests

**Entities affected:** None (read-only delivery)

---

## 4. Authorization Summary

| Flow | Public | Admin |
|---|---|---|
| View homepage | ✅ | ✅ |
| Browse projects | ✅ | ✅ |
| View project detail | ✅ (published only) | ✅ (all) |
| View experience | ✅ | ✅ |
| View skills | ✅ (visible only) | ✅ |
| View certifications | ✅ | ✅ |
| View about | ✅ | ✅ |
| Submit contact form | ✅ | ✅ |
| Download CV | ✅ | ✅ |
| Admin login | ✅ | ✅ |
| Admin dashboard | ❌ | ✅ |
| Create / edit / delete project | ❌ | ✅ |
| Toggle publish / featured | ❌ | ✅ |
| Upload screenshots | ❌ | ✅ |
| Manage case study | ❌ | ✅ |
| Create / edit / delete experience | ❌ | ✅ |
| Create / edit / delete skill | ❌ | ✅ |
| Create / edit / delete certification | ❌ | ✅ |
| Upload CV | ❌ | ✅ |
| Manage media library | ❌ | ✅ |
| Update profile settings | ❌ | ✅ |
| View / manage contact messages | ❌ | ✅ |

---

## 5. Data Model Impact Summary

The following entities are created, read, updated, or deleted across these flows. This table feeds directly into TK-03 (data model design).

| Entity | Operations | Key Flows |
|---|---|---|
| `PROFILE_SETTINGS` | Read, Update | 1.1, 1.7, 1.9, 2.21, 2.23 |
| `PROJECT` | Create, Read, Update, Delete | 1.2, 1.3, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8 |
| `CASE_STUDY` | Create, Read, Update | 1.3, 2.10 |
| `EXPERIENCE` | Create, Read, Update, Delete | 1.4, 2.11, 2.12, 2.13, 2.14 |
| `SKILL` | Create, Read, Update, Delete | 1.5, 2.15, 2.16, 2.17 |
| `CERTIFICATION` | Create, Read, Update, Delete | 1.6, 2.18, 2.19, 2.20 |
| `MEDIA` | Create, Read, Delete | 1.3, 1.9, 2.9, 2.18, 2.21, 2.22 |
| `CONTACT_MESSAGE` | Create, Read, Update | 1.8, 2.24, 2.25 |

---

**Last Updated:** 2026-05-11
**Status:** Complete
**Next:** TK-03 (Data Model) can be written based on this document
