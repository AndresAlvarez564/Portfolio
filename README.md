# Portfolio CRM

Personal portfolio management system built on AWS serverless architecture.

**Public site** — projects, experience, skills, certifications, contact form.  
**Admin panel** — protected CMS to manage all portfolio content without editing code.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS + Ant Design |
| Backend | Python 3.12 Lambda functions |
| Database | Amazon DynamoDB (single-table design) |
| Auth | Amazon Cognito |
| API | Amazon API Gateway REST API |
| Storage | Amazon S3 + CloudFront |
| Email | Amazon SES + SQS |
| Infrastructure | AWS CDK TypeScript |
| CI/CD | CodePipeline + CodeBuild + CodeDeploy |

---

## Repository Structure

```text
/
├── front/          # React frontend
├── lambdas/        # Python Lambda functions (one per domain)
├── infra/          # AWS CDK infrastructure
├── scripts/        # One-time setup scripts (seed data, etc.)
├── docs/           # Architecture, tickets, and project settings
└── buildspec.yml   # CodeBuild pipeline definition
```

---

## Branching Strategy

| Branch | Purpose | Pipeline |
|---|---|---|
| `dev` | Development and testing | Deploys to `portfolio-dev-AppStack` |
| `prod` | Production | Deploys to `portfolio-prod-AppStack` |
| `main` | Progress backup / history | No pipeline |
| `feature/tk-xx-*` | Feature work | Merge into `dev` |

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12
- AWS CLI configured (default profile)
- AWS CDK: `npm install -g aws-cdk`

### Frontend

```bash
cd front
cp .env.example .env.local   # fill in values from CloudFormation outputs
npm install
npm run dev
```

### Deploy to dev (manual)

```bash
cd infra
npm install
npm run build
npx cdk deploy portfolio-dev-AppStack
```

---

## Documentation

- `docs/config.md` — reusable technical standards and conventions
- `docs/context.md` — project context for AI sessions
- `docs/project-settings/` — architecture, database, backend, frontend, deployment docs
- `docs/tickets/` — development tickets (TK-01 onwards)
