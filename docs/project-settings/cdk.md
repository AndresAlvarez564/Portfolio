# CDK Structure

> Status: Complete
> Assigned ticket: TK-15

---

## Overview

The infrastructure is defined in `infra/` using AWS CDK with TypeScript. All AWS resources are created, updated, and deleted through CDK — nothing is created manually in the console except the GitHub connection and the three SSM parameters required by the pipeline.

---

## Folder Structure

```text
infra/
├── bin/
│   └── app.ts                    # CDK entry point — instantiates PipelineStack
├── lib/
│   ├── app-stack.ts              # Main application stack — all app resources
│   ├── app-stage.ts              # Deployment stage wrapper — wraps AppStack
│   ├── pipeline-stack.ts         # CI/CD stack — CodePipeline + CodeBuild
│   └── constructs/
│       ├── auth.ts               # Cognito User Pool, app client, admin group
│       ├── database.ts           # DynamoDB table and GSIs
│       ├── frontend-hosting.ts   # S3 buckets and CloudFront distributions
│       ├── lambdas.ts            # Lambda functions, aliases, CodeDeploy groups
│       ├── api.ts                # API Gateway REST API and Cognito authorizer
│       ├── monitoring.ts         # CloudWatch duration alarms
│       ├── security.ts           # KMS, secrets, Parameter Store (placeholder)
│       └── async-processing.ts   # SQS, EventBridge (placeholder)
└── config/
    ├── dev.ts                    # Development environment settings
    ├── staging.ts                # Staging environment settings
    └── prod.ts                   # Production environment settings
```

---

## Stacks

### AppStack

`AppStack` contains all application infrastructure. It is deployed by the pipeline on every push to the `dev` branch.

Constructs instantiated inside `AppStack`, in dependency order:

| Order | Construct | Depends on |
|---|---|---|
| 1 | `AuthConstruct` | — |
| 2 | `DatabaseConstruct` | — |
| 3 | `FrontendHostingConstruct` | — |
| 4 | `LambdasConstruct` | `DatabaseConstruct`, `FrontendHostingConstruct` |
| 5 | `ApiConstruct` | `LambdasConstruct`, `AuthConstruct` |
| 6 | `MonitoringConstruct` | `LambdasConstruct`, `ApiConstruct` |
| 7 | `SecurityConstruct` | — |

Stack name pattern: `portfolio-<stage>-AppStack`

### AppStage

`AppStage` wraps `AppStack` inside a CDK Stage. This is the unit that the pipeline deploys. It passes the environment config and `env` (account + region) down to `AppStack`.

### PipelineStack

`PipelineStack` contains the CI/CD infrastructure. It is deployed **manually once** and then manages all subsequent deployments automatically.

Resources inside `PipelineStack`:
- S3 artifact bucket (`portfolio-pipeline-artifacts-<account-id>`)
- CodeBuild project (`portfolio-build`)
- CodePipeline (`portfolio-pipeline`) with two stages: Source → Build

Stack name: `PipelineStack`

---

## Constructs

### AuthConstruct — `constructs/auth.ts`

Creates the Cognito authentication resources.

| Resource | Name |
|---|---|
| User Pool | `portfolio-<stage>-user-pool` |
| App Client | `portfolio-<stage>-client` |
| Admin Group | `admin` |

Configuration:
- Self sign-up disabled
- Email sign-in only
- Password policy: min 8 chars, uppercase + lowercase + digit + symbol
- MFA: OFF in dev/staging, OPTIONAL (TOTP) in prod
- Token validity: ID token 1h, refresh token 30 days
- Auth flows: `USER_PASSWORD_AUTH` + SRP

Outputs: `UserPoolId`, `UserPoolClientId`

---

### DatabaseConstruct — `constructs/database.ts`

Creates the DynamoDB single-table and all GSIs.

| Resource | Name |
|---|---|
| Table | `portfolio-<stage>-main` |

Keys: `pk` (String) / `sk` (String), billing: `PAY_PER_REQUEST`

GSIs:

| Index | Partition Key | Sort Key | Purpose |
|---|---|---|---|
| `gsi1` | `gsi1pk` | `gsi1sk` | General-purpose: projects by status, experience by order, skills by visibility, certifications by date, media by type, contact messages by status |
| `gsi2` | `gsi2pk` | `gsi2sk` | Featured project ordering, media by related entity |
| `gsi3` | `gsi3pk` | `gsi3sk` | Project lookup by URL slug |

PITR: disabled in dev, enabled in staging and prod.
Removal policy: `DESTROY` in dev, `RETAIN` in staging and prod.

Outputs: `TableName`, `TableArn`

---

### FrontendHostingConstruct — `constructs/frontend-hosting.ts`

Creates two private S3 buckets and two CloudFront distributions.

| Resource | Name |
|---|---|
| Frontend bucket | `portfolio-<stage>-frontend-<account-id>` |
| Media bucket | `portfolio-<stage>-media-<account-id>` |
| Frontend distribution | `portfolio-<stage>-distribution` |
| Media distribution | `portfolio-<stage>-media-distribution` |

Both buckets: `BLOCK_ALL` public access, S3-managed encryption, `enforceSSL`.

Media bucket has a CORS rule allowing `PUT` from any origin — required for pre-signed URL uploads directly from the browser.

Frontend distribution:
- OAC (Origin Access Control) — S3 bucket is never exposed directly
- HTTPS only, TLS 1.2+
- `defaultRootObject: index.html`
- Error responses: 403 and 404 → `/index.html` (React Router fallback)

Media distribution:
- OAC, HTTPS only, TLS 1.2+
- Optimized caching for media files

Outputs: `FrontendBucketName`, `MediaBucketName`, `FrontendUrl`, `FrontendDistributionId`, `MediaUrl`, `MediaDistributionId`

---

### LambdasConstruct — `constructs/lambdas.ts`

Creates one Lambda function per business domain, plus a `live` alias and CodeDeploy deployment group for each.

Domains: `profile`, `projects`, `experience`, `skills`, `certifications`, `media`, `contact`

Function naming: `portfolio-<stage>-<domain>`

Runtime: Python 3.12, ARM64, X-Ray tracing active.

Environment variables on every function:

| Variable | Value |
|---|---|
| `STAGE` | `dev` / `staging` / `prod` |
| `TABLE_NAME` | DynamoDB table name |
| `LOG_LEVEL` | `DEBUG` in dev/staging, `WARNING` in prod |
| `POWERTOOLS_SERVICE_NAME` | `portfolio-<domain>` |

Additional variable on `media` only:

| Variable | Value |
|---|---|
| `MEDIA_BUCKET_NAME` | Media S3 bucket name |

IAM grants:
- All functions: `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` on the main table
- `media` function: `s3:GetObject`, `PutObject`, `DeleteObject` on the media bucket

**CodeDeploy setup per function:**
1. `fn.currentVersion` — immutable Lambda version snapshot
2. `lambda.Alias` named `live` — stable pointer used by API Gateway
3. `cloudwatch.Alarm` on errors (1-minute period, threshold 1) — triggers rollback
4. `codedeploy.LambdaDeploymentGroup` — shifts traffic using environment-specific strategy

Deployment strategies:

| Environment | Strategy | Behavior |
|---|---|---|
| `dev` | `ALL_AT_ONCE` | Instant shift — fast feedback |
| `staging` | `LINEAR_10PERCENT_EVERY_1MINUTE` | 10% per minute until 100% |
| `prod` | `CANARY_10PERCENT_5MINUTES` | 10% for 5 minutes, then 100% |

Exposed properties: `aliases` (used by `ApiConstruct`), `functions` (used by `MonitoringConstruct`)

---

### ApiConstruct — `constructs/api.ts`

Creates the API Gateway REST API with Cognito authorizer and all route resources.

| Resource | Name |
|---|---|
| REST API | `portfolio-<stage>-api` |
| Cognito Authorizer | `portfolio-<stage>-authorizer` |
| Access log group | `/aws/apigateway/portfolio-<stage>-api` |

Configuration:
- X-Ray tracing and CloudWatch metrics enabled
- Access logs with JSON format
- `dataTraceEnabled` off in prod (avoids logging request bodies)
- CORS: all origins in dev/staging (restrict to real domain in prod)
- Authorizer identity source: `method.request.header.Authorization`
- Authorizer results cache: 5 minutes

All routes use `lambdas.aliases` — API Gateway calls the `live` alias, never `$LATEST`.

Public routes (no authorizer): `GET /profile`, `GET /projects`, `GET /projects/{slug}`, `GET /experience`, `GET /skills`, `GET /certifications`, `POST /contact`

Protected routes (Cognito authorizer): all admin mutations and reads — see `docs/project-settings/security.md` for the full list.

Outputs: `ApiUrl`, `ApiId`

---

### MonitoringConstruct — `constructs/monitoring.ts`

Creates CloudWatch duration alarms for each Lambda function.

| Alarm | Threshold | Period |
|---|---|---|
| `portfolio-<stage>-<domain>-duration-alarm` | 80% of configured timeout | 5 minutes |

Note: error alarms are created in `LambdasConstruct` and owned by CodeDeploy deployment groups. Duration alarms are created here for operational visibility.

---

### SecurityConstruct — `constructs/security.ts`

Placeholder. Will be implemented in Phase 3 if needed.

Planned: KMS keys, Secrets Manager secrets, Parameter Store parameters. WAF is not used in this project.

---

### AsyncProcessingConstruct — `constructs/async-processing.ts`

Placeholder. Will be implemented when the contact form email flow is built.

Planned: SQS queue + DLQ for email notifications, EventBridge Scheduler for future scheduled tasks.

---

## Environment Configs

All three configs share the same `EnvironmentConfig` interface defined in `config/dev.ts`.

| Setting | dev | staging | prod |
|---|---|---|---|
| `removalPolicy` | `destroy` | `retain` | `retain` |
| `enablePitr` | `false` | `true` | `true` |
| `enableWaf` | `false` | `false` | `false` |
| `lambdaMemory` | `256` MB | `512` MB | `512` MB |
| `lambdaTimeoutSeconds` | `10` s | `15` s | `15` s |

---

## Deployment Commands

### First-time setup (run once)

Bootstrap CDK in your AWS account:

```bash
cd infra
npx cdk bootstrap --profile portfolio-dev
```

Create the three SSM parameters required by `PipelineStack` before deploying it:

```bash
aws ssm put-parameter --name /portfolio/pipeline/github-owner --value "<your-github-username>" --type String --profile portfolio-dev
aws ssm put-parameter --name /portfolio/pipeline/github-repo --value "<your-repo-name>" --type String --profile portfolio-dev
aws ssm put-parameter --name /portfolio/pipeline/github-connection-arn --value "<connection-arn>" --type String --profile portfolio-dev
```

The GitHub connection ARN is created in the AWS Console under **Developer Tools → Connections**. It must be in `Available` status before deploying.

Deploy `PipelineStack` manually (one time only):

```bash
cd infra
npx cdk deploy PipelineStack --profile portfolio-dev
```

After this, every push to the `dev` branch triggers the pipeline automatically.

### Manual deployment (dev only)

To deploy `AppStack` directly without the pipeline:

```bash
cd infra
npm run build
npx cdk deploy portfolio-dev-AppStack --profile portfolio-dev
```

### Useful CDK commands

```bash
# See what will change before deploying
npx cdk diff portfolio-dev-AppStack --profile portfolio-dev

# Synthesize CloudFormation templates without deploying
npx cdk synth

# List all stacks
npx cdk list

# Destroy dev stack (removes all resources with DESTROY removal policy)
npx cdk destroy portfolio-dev-AppStack --profile portfolio-dev
```

---

**Last Updated:** 2026-05-11
**Status:** Complete
**Next:** TK-16 (backend.md)
