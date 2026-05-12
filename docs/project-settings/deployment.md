# Deployment

> Status: Initial draft — finalize in Phase 3.
> Assigned ticket: TK-17 (initial draft)

---

## Overview

The project uses two environments and two pipelines:

| Branch | Environment | Pipeline | Purpose |
|---|---|---|---|
| `dev` | `portfolio-dev` | `portfolio-dev-pipeline` | Development and testing |
| `prod` | `portfolio-prod` | `portfolio-prod-pipeline` | Production |
| `main` | — | None | Saving progress and history |

**Automated** — every push to `dev` triggers the dev pipeline. Every push to `prod` triggers the prod pipeline.

**Manual** — used during initial setup and for one-off infrastructure changes.

---

## Branch Strategy

```text
feature/tk-xx → dev → prod
                 ↓      ↓
                dev    prod
```

- Work on feature branches, merge into `dev`
- `dev` pipeline deploys automatically to `portfolio-dev-AppStack`
- When ready for production, merge `dev` into `prod`
- `prod` pipeline deploys automatically to `portfolio-prod-AppStack`
- `main` is used for saving progress — no pipeline attached

---

## Pipeline Flow

```text
Developer pushes to dev (or prod) branch
↓
GitHub (CodeStar Connection)
↓
CodePipeline — Source stage
↓
CodePipeline — Build stage
↓
CodeBuild (buildspec.yml)
  ├── Install: npm ci (infra + front), pip install (lambdas)
  ├── Pre-build: pytest — Lambda unit tests  ← blocks on failure
  ├── Pre-build: npm run test --run — frontend tests  ← blocks on failure
  ├── Build: npm run build (frontend)
  ├── Build: cdk synth + cdk deploy portfolio-<DEPLOY_STAGE>-AppStack
  └── Post-build: s3 sync + CloudFront invalidation
↓
CodeDeploy shifts traffic to new Lambda versions via live alias
↓
If error alarm fires → CodeDeploy rolls back automatically
```

---

## Stacks

| Stack | Deployed by | Description |
|---|---|---|
| `portfolio-dev-AppStack` | dev pipeline or manual | All dev resources |
| `portfolio-prod-AppStack` | prod pipeline or manual | All prod resources |
| `portfolio-dev-PipelineStack` | Manual once | Dev CI/CD pipeline |
| `portfolio-prod-PipelineStack` | Manual once | Prod CI/CD pipeline |

---

## First-Time Setup

These steps are run once before the pipelines can manage deployments.

### 1. Bootstrap CDK

```bash
cd infra
npx cdk bootstrap
```

### 2. Create GitHub Connection in AWS Console

Go to **AWS Console → Developer Tools → Connections → Create connection**.
Select GitHub, authorize, and copy the connection ARN once it shows `Available`.

### 3. Set Parameter Store values

```bash
aws ssm put-parameter --name /portfolio/pipeline/github-owner --value "AndresAlvarez564" --type String
aws ssm put-parameter --name /portfolio/pipeline/github-repo  --value "Portfolio" --type String
aws ssm put-parameter --name /portfolio/pipeline/github-connection-arn --value "<connection-arn>" --type String
```

### 4. Deploy dev pipeline (one time)

```bash
cd infra
npm run build
npx cdk deploy portfolio-dev-PipelineStack
```

### 5. Deploy prod pipeline (one time, when ready for production)

```bash
npx cdk deploy portfolio-prod-PipelineStack
```

After this, every push to `dev` or `prod` deploys automatically.

---

## Manual Deployment

Use when you need to deploy without waiting for the pipeline.

```bash
# Dev
cd infra && npm run build
npx cdk deploy portfolio-dev-AppStack

# Prod
npx cdk deploy portfolio-prod-AppStack
```

Preview changes before deploying:

```bash
npx cdk diff portfolio-dev-AppStack
```

---

## CodeDeploy — Lambda Traffic Shifting

| Environment | Strategy | Behavior |
|---|---|---|
| `dev` | All-at-once | Instant shift — fast feedback |
| `prod` | Canary 10% for 5 minutes | 10% of traffic for 5 min, then 100% |

If the CloudWatch error alarm fires during the shift, CodeDeploy rolls back automatically.

---

## Rollback

### Automatic (CodeDeploy)

CodeDeploy monitors the error alarm on each Lambda. If errors exceed the threshold during deployment, it rolls back automatically.

### Manual (Lambda alias)

```bash
# List versions
aws lambda list-versions-by-function --function-name portfolio-dev-projects

# Point live alias to a previous version
aws lambda update-alias \
  --function-name portfolio-dev-projects \
  --name live \
  --function-version <version-number>
```

### Infrastructure (CloudFormation)

```bash
# Revert via git and push — pipeline redeploys the previous code
git revert HEAD
git push origin dev
```

---

## CloudFront Cache Invalidation

Automated in `buildspec.yml` after every deploy. Manual if needed:

```bash
aws cloudfront create-invalidation \
  --distribution-id E29N2QL8DOM3KB \
  --paths "/*"
```

---

## CloudFormation Outputs — Dev

| Export name | Description |
|---|---|
| `portfolio-dev-user-pool-id` | Cognito User Pool ID |
| `portfolio-dev-user-pool-client-id` | Cognito App Client ID |
| `portfolio-dev-table-name` | DynamoDB table name |
| `portfolio-dev-api-url` | API Gateway base URL |
| `portfolio-dev-frontend-url` | CloudFront URL for the frontend |
| `portfolio-dev-frontend-distribution-id` | CloudFront distribution ID |
| `portfolio-dev-media-url` | CloudFront URL for media files |
| `portfolio-dev-frontend-bucket` | Frontend S3 bucket name |
| `portfolio-dev-media-bucket` | Media S3 bucket name |

Read all outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name portfolio-dev-AppStack \
  --query "Stacks[0].Outputs" \
  --output table
```

---

## Tailing Lambda Logs

```bash
aws logs tail /aws/lambda/portfolio-dev-<domain> --follow
```

Replace `<domain>` with: `profile`, `projects`, `experience`, `skills`, `certifications`, `media`, `contact`.

---

**Last Updated:** 2026-05-12
**Status:** Updated — two-environment model (dev + prod), no staging
**Next:** Finalize in Phase 3 — add advanced rollback and troubleshooting guide
