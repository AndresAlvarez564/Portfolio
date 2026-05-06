# <project-name>

Replace this with a short description of the project.

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x or later |
| Python | 3.12 |
| AWS CLI | v2 |
| AWS CDK | latest |

### Setup

```bash
# Configure AWS profiles
aws configure --profile <project-name>-dev
aws configure --profile <project-name>-staging
aws configure --profile <project-name>-prod

# Install CDK dependencies
cd infra && npm ci

# Deploy to dev
npx cdk deploy --all --profile <project-name>-dev

# Run frontend locally
cd front && npm ci && npm run dev
```

---

## Project Structure

```text
/
├── front/        → React frontend (Vite + TypeScript + Ant Design)
├── lambdas/      → Python Lambda functions
├── infra/        → AWS CDK infrastructure (TypeScript)
├── docs/
│   ├── config.md           → reusable technical standard
│   ├── context.md          → project context for AI sessions
│   ├── project-settings/   → project-specific documentation
│   └── tickets/            → project tickets
└── README.md
```

---

## Documentation

| Document | Purpose |
|---|---|
| `docs/config.md` | Reusable technical standards for this stack |
| `docs/context.md` | Project context — paste into AI chats |
| `docs/project-settings/architecture.md` | System architecture |
| `docs/project-settings/backend.md` | Lambda modules and business logic |
| `docs/project-settings/database.md` | DynamoDB table design and access patterns |
| `docs/project-settings/deployment.md` | Deployment steps and rollback |

---

## Branching Strategy

```
feature/* → dev → develop → main
              ↓       ↓        ↓
             dev   staging   prod
```
