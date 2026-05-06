# Project Context

This file describes the current project. It is used to give full context to any AI assistant or new team member at the start of a session.

Paste this file at the beginning of any chat to avoid re-explaining the project from scratch.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project name | `<project-name>` |
| Client | `<client-name>` |
| Industry | `<industry>` (e.g. real estate, logistics, healthcare) |
| Stage | `<current-stage>` (e.g. in development, in staging, in production) |
| Started | `<start-date>` |
| Repository | `<repo-url>` |

---

## 2. What This Project Is

Write 2–4 sentences describing what the system does, who uses it, and what problem it solves.

Example:

> This is a CRM for a real estate company. It allows agents to register clients, track property interest, manage project stages, and receive notifications when a client's status changes. The system is used internally by the sales team and managed by admins.

---

## 3. Users and Roles

| Role | Description |
|---|---|
| `admin` | Full access. Manages users, projects, and configuration. |
| `manager` | Can view and edit all records within their assigned projects. |
| `viewer` | Read-only access to assigned records. |

Add or remove roles as needed for this project.

---

## 4. Business Rules

List the key business rules that affect how the system behaves. These are the rules that must be enforced in the backend.

Examples:

- A client can only be registered once per project (uniqueness by ID number + project).
- Only admins can create new users.
- A project cannot be deleted if it has active clients.
- Notifications are sent when a client status changes to "interested".

---

## 5. Key Entities

List the main data entities in the system and a brief description of each.

| Entity | Description |
|---|---|
| `User` | System user with a role (admin, manager, viewer) |
| `Client` | Person registered in the system with contact info and ID number |
| `Project` | A real estate or business project that clients are associated with |
| `Stage` | A phase within a project that a client can be assigned to |

---

## 6. Main Flows

Describe the most important user flows in plain language.

Example:

**Client registration flow:**
An agent fills out the client form with name, ID number, and project. The system checks for duplicates by ID number within the same project. If a duplicate exists, the agent sees an error. If not, the client is saved and the agent is redirected to the client detail view.

**Login flow:**
The user enters their email and password. Cognito validates the credentials. On success, the frontend stores the session and redirects to the dashboard based on the user's role.

---

## 7. AWS Configuration

| Setting | Value |
|---|---|
| AWS Account ID | `<account-id>` |
| Region | `<region>` (e.g. `us-east-1`) |
| Project name (CDK) | `<project-name>` |
| Dev environment | `<project-name>-dev` |
| Staging environment | `<project-name>-staging` |
| Prod environment | `<project-name>-prod` |

---

## 8. Tech Stack

This project follows the standard stack defined in `docs/config.md`.

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Ant Design + Amplify v6 |
| Backend | Python 3.12 Lambda functions |
| Database | Amazon DynamoDB |
| Auth | Amazon Cognito |
| API | Amazon API Gateway REST API |
| Hosting | Amazon S3 + CloudFront |
| Infrastructure | AWS CDK TypeScript |
| CI/CD | CodePipeline + CodeBuild + CodeDeploy |

---

## 9. Repository Structure

```text
/
├── front/        → React frontend
├── lambdas/      → Python Lambda functions
├── infra/        → AWS CDK infrastructure
├── docs/
│   ├── config.md           → reusable technical standard
│   ├── context.md          → this file
│   ├── project-settings/   → project-specific documentation
│   └── tickets/            → project tickets
└── README.md
```

---

## 10. Current Status

Describe where the project is right now. What has been built, what is in progress, what is pending.

Example:

> Phase 1 is complete. Infrastructure is deployed to dev. Login and route protection are working. Phase 2 is in progress — client registration (TK-24) is done, project listing (TK-25) is in progress.

---

## 11. Open Decisions

List any technical or business decisions that have not been made yet.

Example:

- Not decided: whether to use Step Functions or SQS for the notification flow.
- Not decided: whether the client export feature will be a CSV download or an email attachment.

---

## 12. Known Issues

List any known bugs, limitations, or technical debt that the team is aware of.

Example:

- The client list does not paginate yet — it loads all records at once.
- The CloudWatch dashboard has not been created yet (pending TK-LAST+5).

---

## 13. Important Links

| Resource | URL |
|---|---|
| Repository | `<repo-url>` |
| AWS Console (dev) | `<aws-console-url>` |
| Staging URL | `<staging-url>` |
| Production URL | `<prod-url>` |
| Figma / Design | `<design-url>` |

---

## 14. How to Use This File

- Paste this file at the start of any AI chat session to give full project context.
- Update this file whenever the project status, business rules, or key decisions change.
- Keep it short and factual — this is not a technical spec, it is a context summary.
- The full technical standard lives in `docs/config.md`.
- The full project documentation lives in `docs/project-settings/`.
