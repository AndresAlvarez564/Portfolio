# Database

> Status: Complete (initial draft)
> Assigned ticket: TK-03 / TK-06

---

## Table Design

| Setting | Value |
|---|---|
| Table name | `portfolio-<stage>-main` |
| Partition key | `pk` (String) |
| Sort key | `sk` (String) |
| Billing mode | PAY_PER_REQUEST |
| PITR | Disabled in dev, Enabled in staging and prod |

All entities live in a single table. The `pk` and `sk` are generic strings that encode entity type and ID. Every item includes an `entityType` attribute for filtering and a `createdAt` / `updatedAt` timestamp in ISO 8601 format.

---

## Entity Patterns

### PROFILE_SETTINGS

Singleton record — there is only one profile in the system.

| Attribute | Value |
|---|---|
| `pk` | `PROFILE` |
| `sk` | `SETTINGS` |
| `entityType` | `PROFILE_SETTINGS` |
| `name` | String |
| `title` | String |
| `summary` | String |
| `location` | String |
| `email` | String |
| `socialLinks` | Map — `{ github, linkedin, twitter, website }` |
| `cvFileUrl` | String — CloudFront URL of the active CV PDF |
| `cvS3Key` | String — S3 key of the active CV PDF |
| `updatedAt` | String (ISO 8601) |

**Notes:**
- No `createdAt` — this record is seeded once and only updated.
- `cvFileUrl` is replaced on every CV upload.

---

### PROJECT

| Attribute | Value |
|---|---|
| `pk` | `PROJECT#<projectId>` |
| `sk` | `METADATA` |
| `entityType` | `PROJECT` |
| `projectId` | String (UUID) |
| `slug` | String — URL-safe identifier (e.g., `jam-construcciones-crm`) |
| `title` | String |
| `description` | String |
| `techStack` | List of Strings |
| `category` | String (e.g., `serverless`, `crm`, `ecommerce`) |
| `status` | String — `draft` \| `published` |
| `featured` | Boolean |
| `featuredOrder` | Number — display order on homepage (null if not featured) |
| `thumbnailUrl` | String — CloudFront URL of the main thumbnail |
| `thumbnailS3Key` | String |
| `screenshotKeys` | List of Strings — S3 keys of screenshots |
| `screenshotUrls` | List of Strings — CloudFront URLs of screenshots |
| `githubUrl` | String (optional) |
| `liveUrl` | String (optional) |
| `createdAt` | String (ISO 8601) |
| `updatedAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `PROJECT` |
| `gsi1sk` | `STATUS#<status>#<createdAt>` — e.g., `STATUS#published#2026-05-11T00:00:00Z` |
| `gsi2pk` | `PROJECT` |
| `gsi2sk` | `FEATURED#<featured>#<featuredOrder>` — e.g., `FEATURED#true#001` |
| `gsi3pk` | `SLUG#<slug>` |
| `gsi3sk` | `PROJECT` |

---

### CASE_STUDY

One case study per project. Stored as a separate item to keep PROJECT items lean.

| Attribute | Value |
|---|---|
| `pk` | `PROJECT#<projectId>` |
| `sk` | `CASE_STUDY` |
| `entityType` | `CASE_STUDY` |
| `projectId` | String |
| `problem` | String |
| `solution` | String |
| `architecture` | String |
| `challenges` | String (optional) |
| `results` | String (optional) |
| `updatedAt` | String (ISO 8601) |

**Notes:**
- Same `pk` as the parent PROJECT — enables fetching project + case study in a single Query on `pk = PROJECT#<id>`.

---

### EXPERIENCE

| Attribute | Value |
|---|---|
| `pk` | `EXPERIENCE#<experienceId>` |
| `sk` | `METADATA` |
| `entityType` | `EXPERIENCE` |
| `experienceId` | String (UUID) |
| `company` | String |
| `title` | String |
| `description` | String |
| `startDate` | String (YYYY-MM) |
| `endDate` | String (YYYY-MM) or `null` if current |
| `current` | Boolean |
| `order` | Number — display order (lower = first) |
| `createdAt` | String (ISO 8601) |
| `updatedAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `EXPERIENCE` |
| `gsi1sk` | `ORDER#<order padded to 3 digits>` — e.g., `ORDER#001` |

---

### SKILL

| Attribute | Value |
|---|---|
| `pk` | `SKILL#<skillId>` |
| `sk` | `METADATA` |
| `entityType` | `SKILL` |
| `skillId` | String (UUID) |
| `name` | String |
| `category` | String (e.g., `cloud`, `backend`, `frontend`, `devops`, `databases`) |
| `visibility` | String — `visible` \| `hidden` |
| `order` | Number — display order within category |
| `createdAt` | String (ISO 8601) |
| `updatedAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `SKILL` |
| `gsi1sk` | `VISIBILITY#<visibility>#<category>` — e.g., `VISIBILITY#visible#cloud` |

---

### CERTIFICATION

| Attribute | Value |
|---|---|
| `pk` | `CERTIFICATION#<certificationId>` |
| `sk` | `METADATA` |
| `entityType` | `CERTIFICATION` |
| `certificationId` | String (UUID) |
| `name` | String |
| `issuer` | String |
| `issueDate` | String (YYYY-MM) |
| `expirationDate` | String (YYYY-MM) or `null` if no expiration |
| `verificationUrl` | String (optional) |
| `badgeUrl` | String — CloudFront URL of badge image |
| `badgeS3Key` | String |
| `createdAt` | String (ISO 8601) |
| `updatedAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `CERTIFICATION` |
| `gsi1sk` | `ISSUEDATE#<issueDate>` — e.g., `ISSUEDATE#2024-11` |

---

### MEDIA

| Attribute | Value |
|---|---|
| `pk` | `MEDIA#<mediaId>` |
| `sk` | `METADATA` |
| `entityType` | `MEDIA` |
| `mediaId` | String (UUID) |
| `s3Key` | String — full S3 object key |
| `cloudfrontUrl` | String — public CDN URL |
| `filename` | String — original filename |
| `contentType` | String — MIME type (e.g., `image/png`, `application/pdf`) |
| `mediaType` | String — `screenshot` \| `badge` \| `cv` \| `thumbnail` \| `diagram` |
| `context` | String — `project-screenshot` \| `certification-badge` \| `cv` \| `project-thumbnail` |
| `relatedId` | String — ID of the related entity (projectId, certificationId, etc.) or `null` |
| `sizeBytes` | Number |
| `createdAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `MEDIA` |
| `gsi1sk` | `TYPE#<mediaType>#<createdAt>` — e.g., `TYPE#screenshot#2026-05-11T00:00:00Z` |
| `gsi2pk` | `MEDIAREF#<relatedId>` |
| `gsi2sk` | `MEDIA#<createdAt>` |

---

### CONTACT_MESSAGE

| Attribute | Value |
|---|---|
| `pk` | `CONTACT#<messageId>` |
| `sk` | `MESSAGE` |
| `entityType` | `CONTACT_MESSAGE` |
| `messageId` | String (UUID) |
| `name` | String |
| `email` | String |
| `subject` | String |
| `message` | String |
| `projectType` | String (optional) |
| `budget` | String (optional) |
| `company` | String (optional) |
| `status` | String — `unread` \| `read` \| `archived` |
| `ipAddress` | String — for rate limiting audit (hashed or partial) |
| `createdAt` | String (ISO 8601) |
| `updatedAt` | String (ISO 8601) |

**GSI attributes:**
| Attribute | Value |
|---|---|
| `gsi1pk` | `CONTACT` |
| `gsi1sk` | `STATUS#<status>#<createdAt>` — e.g., `STATUS#unread#2026-05-11T00:00:00Z` |

---

## GSIs

### GSI-1: `gsi1pk` / `gsi1sk`

General-purpose GSI used by multiple entities. The `gsi1pk` encodes the entity type and `gsi1sk` encodes a sortable filter value.

| Index name | `gsi1` |
|---|---|
| Partition key | `gsi1pk` (String) |
| Sort key | `gsi1sk` (String) |
| Projection | ALL |

**Supports:**
- Query all projects by status (published / draft)
- Query all projects sorted by creation date
- Query all experience entries sorted by display order
- Query all skills by visibility and category
- Query all certifications sorted by issue date
- Query all media by type
- Query all contact messages by status

---

### GSI-2: `gsi2pk` / `gsi2sk`

Used for featured project ordering and media-by-related-entity lookups.

| Index name | `gsi2` |
|---|---|
| Partition key | `gsi2pk` (String) |
| Sort key | `gsi2sk` (String) |
| Projection | ALL |

**Supports:**
- Query featured projects sorted by `featuredOrder`
- Query all media files belonging to a specific project or certification

---

### GSI-3: `gsi3pk` / `gsi3sk`

Used for slug-based project lookups.

| Index name | `gsi3` |
|---|---|
| Partition key | `gsi3pk` (String) |
| Sort key | `gsi3sk` (String) |
| Projection | ALL |

**Supports:**
- Look up a project by its URL slug

---

## Access Patterns

### Profile

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-01 | Get profile settings | GetItem | `pk = PROFILE`, `sk = SETTINGS` | Singleton |
| AP-02 | Update profile settings | UpdateItem | `pk = PROFILE`, `sk = SETTINGS` | Admin only |

---

### Projects

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-03 | Get all published projects | Query GSI-1 | `gsi1pk = PROJECT`, `gsi1sk begins_with STATUS#published` | Public |
| AP-04 | Get all projects (admin) | Query GSI-1 | `gsi1pk = PROJECT` | Returns draft + published |
| AP-05 | Get featured published projects | Query GSI-2 | `gsi2pk = PROJECT`, `gsi2sk begins_with FEATURED#true` | Homepage |
| AP-06 | Get project by ID | GetItem | `pk = PROJECT#<id>`, `sk = METADATA` | Admin edit |
| AP-07 | Get project by slug | Query GSI-3 | `gsi3pk = SLUG#<slug>`, `gsi3sk = PROJECT` | Public detail page |
| AP-08 | Get project + case study | Query | `pk = PROJECT#<id>` | Returns METADATA + CASE_STUDY items |
| AP-09 | Create project | PutItem | `pk = PROJECT#<id>`, `sk = METADATA` | Admin only |
| AP-10 | Update project | UpdateItem | `pk = PROJECT#<id>`, `sk = METADATA` | Admin only |
| AP-11 | Delete project | DeleteItem | `pk = PROJECT#<id>`, `sk = METADATA` | Admin only |
| AP-12 | Update project status | UpdateItem | `pk = PROJECT#<id>`, `sk = METADATA` | Updates `status` + `gsi1sk` |
| AP-13 | Update project featured | UpdateItem | `pk = PROJECT#<id>`, `sk = METADATA` | Updates `featured` + `gsi2sk` |

---

### Case Study

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-14 | Get case study by project ID | GetItem | `pk = PROJECT#<id>`, `sk = CASE_STUDY` | |
| AP-15 | Create or update case study | PutItem | `pk = PROJECT#<id>`, `sk = CASE_STUDY` | Upsert |

---

### Experience

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-16 | Get all experience entries | Query GSI-1 | `gsi1pk = EXPERIENCE`, sort by `gsi1sk` | Ordered by `order` field |
| AP-17 | Get experience by ID | GetItem | `pk = EXPERIENCE#<id>`, `sk = METADATA` | |
| AP-18 | Create experience | PutItem | `pk = EXPERIENCE#<id>`, `sk = METADATA` | Admin only |
| AP-19 | Update experience | UpdateItem | `pk = EXPERIENCE#<id>`, `sk = METADATA` | Admin only |
| AP-20 | Delete experience | DeleteItem | `pk = EXPERIENCE#<id>`, `sk = METADATA` | Admin only |
| AP-21 | Reorder experience | BatchWriteItem | Update `order` + `gsi1sk` for multiple items | Admin only |

---

### Skills

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-22 | Get all visible skills | Query GSI-1 | `gsi1pk = SKILL`, `gsi1sk begins_with VISIBILITY#visible` | Public |
| AP-23 | Get all skills (admin) | Query GSI-1 | `gsi1pk = SKILL` | Returns visible + hidden |
| AP-24 | Get skill by ID | GetItem | `pk = SKILL#<id>`, `sk = METADATA` | |
| AP-25 | Create skill | PutItem | `pk = SKILL#<id>`, `sk = METADATA` | Admin only |
| AP-26 | Update skill | UpdateItem | `pk = SKILL#<id>`, `sk = METADATA` | Admin only |
| AP-27 | Delete skill | DeleteItem | `pk = SKILL#<id>`, `sk = METADATA` | Admin only |

---

### Certifications

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-28 | Get all certifications | Query GSI-1 | `gsi1pk = CERTIFICATION`, sort by `gsi1sk` | Sorted by issue date desc |
| AP-29 | Get certification by ID | GetItem | `pk = CERTIFICATION#<id>`, `sk = METADATA` | |
| AP-30 | Create certification | PutItem | `pk = CERTIFICATION#<id>`, `sk = METADATA` | Admin only |
| AP-31 | Update certification | UpdateItem | `pk = CERTIFICATION#<id>`, `sk = METADATA` | Admin only |
| AP-32 | Delete certification | DeleteItem | `pk = CERTIFICATION#<id>`, `sk = METADATA` | Admin only |

---

### Media

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-33 | Get all media (admin) | Query GSI-1 | `gsi1pk = MEDIA`, sort by `gsi1sk` | |
| AP-34 | Get media by related entity | Query GSI-2 | `gsi2pk = MEDIAREF#<relatedId>` | e.g., all screenshots for a project |
| AP-35 | Get media by ID | GetItem | `pk = MEDIA#<id>`, `sk = METADATA` | |
| AP-36 | Save media metadata | PutItem | `pk = MEDIA#<id>`, `sk = METADATA` | After S3 upload confirmed |
| AP-37 | Delete media record | DeleteItem | `pk = MEDIA#<id>`, `sk = METADATA` | Admin only |

---

### Contact Messages

| # | Operation | Query type | Key condition | Notes |
|---|---|---|---|---|
| AP-38 | Save contact message | PutItem | `pk = CONTACT#<id>`, `sk = MESSAGE` | Public (no auth) |
| AP-39 | Get all messages (admin) | Query GSI-1 | `gsi1pk = CONTACT`, sort by `gsi1sk` desc | Most recent first |
| AP-40 | Get messages by status | Query GSI-1 | `gsi1pk = CONTACT`, `gsi1sk begins_with STATUS#<status>` | Filter by unread/read/archived |
| AP-41 | Get message by ID | GetItem | `pk = CONTACT#<id>`, `sk = MESSAGE` | |
| AP-42 | Update message status | UpdateItem | `pk = CONTACT#<id>`, `sk = MESSAGE` | Updates `status` + `gsi1sk` |

---

## Sample Items

### PROFILE_SETTINGS item

```json
{
  "pk": "PROFILE",
  "sk": "SETTINGS",
  "entityType": "PROFILE_SETTINGS",
  "name": "Andres Isaac Alvarez Herrera",
  "title": "Junior Solutions Architect",
  "summary": "AWS-certified cloud professional...",
  "location": "Cochabamba, Bolivia",
  "email": "andres@example.com",
  "socialLinks": {
    "github": "https://github.com/andres",
    "linkedin": "https://linkedin.com/in/andres"
  },
  "cvFileUrl": "https://cdn.example.com/media/cv/andres-cv.pdf",
  "cvS3Key": "media/cv/andres-cv.pdf",
  "updatedAt": "2026-05-11T00:00:00Z"
}
```

### PROJECT item

```json
{
  "pk": "PROJECT#a1b2c3d4-...",
  "sk": "METADATA",
  "entityType": "PROJECT",
  "projectId": "a1b2c3d4-...",
  "slug": "jam-construcciones-crm",
  "title": "JAM Construcciones — Real Estate CRM",
  "description": "Production-style business management system...",
  "techStack": ["React", "Python", "DynamoDB", "AWS CDK"],
  "category": "crm",
  "status": "published",
  "featured": true,
  "featuredOrder": 1,
  "thumbnailUrl": "https://cdn.example.com/media/thumbnails/jam.png",
  "thumbnailS3Key": "media/thumbnails/jam.png",
  "screenshotKeys": ["media/screenshots/jam-1.png"],
  "screenshotUrls": ["https://cdn.example.com/media/screenshots/jam-1.png"],
  "githubUrl": "https://github.com/andres/jam-crm",
  "liveUrl": null,
  "createdAt": "2026-05-11T00:00:00Z",
  "updatedAt": "2026-05-11T00:00:00Z",
  "gsi1pk": "PROJECT",
  "gsi1sk": "STATUS#published#2026-05-11T00:00:00Z",
  "gsi2pk": "PROJECT",
  "gsi2sk": "FEATURED#true#001",
  "gsi3pk": "SLUG#jam-construcciones-crm",
  "gsi3sk": "PROJECT"
}
```

### CONTACT_MESSAGE item

```json
{
  "pk": "CONTACT#e5f6g7h8-...",
  "sk": "MESSAGE",
  "entityType": "CONTACT_MESSAGE",
  "messageId": "e5f6g7h8-...",
  "name": "Jane Recruiter",
  "email": "jane@company.com",
  "subject": "Job opportunity",
  "message": "Hi Andres, we have an opening...",
  "projectType": null,
  "budget": null,
  "company": "TechCorp",
  "status": "unread",
  "ipAddress": "192.168.x.x",
  "createdAt": "2026-05-11T10:00:00Z",
  "updatedAt": "2026-05-11T10:00:00Z",
  "gsi1pk": "CONTACT",
  "gsi1sk": "STATUS#unread#2026-05-11T10:00:00Z"
}
```

---

## Design Notes

- **Single-table design:** All entities share one table. Queries are always by `pk` (GetItem) or by GSI (Query). Scans are never used.
- **GSI key updates:** When `status`, `featured`, `featuredOrder`, `visibility`, or `order` change, the corresponding GSI sort key must be updated in the same UpdateItem call.
- **Slug uniqueness:** Enforced at the Lambda level before writing. Lambda checks GSI-3 for the slug before creating a new project.
- **Timestamps:** All timestamps are ISO 8601 strings in UTC. Sort key prefixes use the same format so lexicographic sort equals chronological sort.
- **Order padding:** Numeric order values are zero-padded to 3 digits in sort keys (e.g., `001`, `010`) to ensure correct lexicographic ordering.
- **CV replacement:** On CV upload, the old `MEDIA` record is not deleted immediately — it is marked inactive. `PROFILE_SETTINGS.cvFileUrl` is updated to point to the new file. Old S3 objects can be cleaned up via S3 lifecycle policy.
- **No Scan:** Every access pattern uses GetItem or Query. This is enforced by design.

---

**Last Updated:** 2026-05-11
**Status:** Complete
**Next:** TK-04 (API design) and TK-05 (CDK infrastructure) can be written based on this document
