# Deployment

> Status: Initial draft — finalize in Phase 3.
> Assigned ticket: TK-17 (initial draft)

---

## Overview

Deployments follow two paths:

- **Automated** — every push to the `dev` branch triggers CodePipeline, which runs tests, synthesizes CDK, and deploys `AppStack` automatically.
- **Manual** — used during initial setup and for one-off infrastructure changes before the pipeline is active.

`PipelineStack` is deployed manually once. After that, the pipeline manages all subsequent deployments.

---

## Pipeline Flow

```text
Developer pushes to dev branch
↓
GitHub (CodeStar Connection)
↓
CodePipeline — Source stage
↓
CodePipeline — Build stage
↓
CodeBuild (buildspec.yml)
  ├── Install: npm ci (infra), pip install (lambdas)
  ├── Pre-build: pytest — Lambda unit tests
  └── Build: CDK synth → cdk deploy AppStack
↓
CloudFormation deploys AppStack
↓
CodeDeploy shifts traffic to new Lambda versions via `live` alias
↓
If error alarm fires → CodeDeploy rolls back automatically
```

The pipeline watches the `dev` branch. Staging and prod deployments will be added in Phase 3.

---

## First-Time Setup

These steps are run once before the pipeline can manage deployments.

### 1. Configure AWS CLI profile

```bash
aws configure --profile portfolio-dev
```

### 2. Bootstrap CDK

CDK bootstrap creates the S3 bucket and IAM roles that CDK needs to deploy stacks.

```bash
cd infra
npx cdk bootstrap --profile portfolio-dev
```

### 3. Create SSM parameters for the pipeline

The pipeline reads these three values from Parameter Store at deploy time. Set them before deploying `PipelineStack`.

```bash
aws ssm put-parameter \
  --name /portfolio/pipeline/github-owner \
  --value "<your-github-username>" \
  --type String \
  --profile portfolio-dev

aws ssm put-parameter \
  --name /portfolio/pipeline/github-repo \
  --value "<your-repo-name>" \
  --type String \
  --profile portfolio-dev

aws ssm put-parameter \
  --name /portfolio/pipeline/github-connection-arn \
  --value "<connection-arn>" \
  --type String \
  --profile portfolio-dev
```

The GitHub connection ARN is created in the AWS Console under **Developer Tools → Connections**. The connection must be in `Available` status before deploying.

### 4. Deploy PipelineStack (one time only)

```bash
cd infra
npm run build
npx cdk deploy PipelineStack --profile portfolio-dev
```

After this, every push to `dev` triggers the pipeline automatically.

---

## Manual Deployment (dev)

Use this when you need to deploy infrastructure changes directly without waiting for the pipeline — for example, during initial development or when the pipeline is not yet active.

```bash
cd infra
npm run build
npx cdk deploy portfolio-dev-AppStack --profile portfolio-dev
```

To see what will change before deploying:

```bash
npx cdk diff portfolio-dev-AppStack --profile portfolio-dev
```

To deploy all stacks at once:

```bash
npx cdk deploy --all --profile portfolio-dev
```

---

## buildspec.yml — Build Steps

The `buildspec.yml` at the repository root defines what CodeBuild runs on each pipeline execution.

**Current steps (Phase 1 — infrastructure only):**

| Phase | Commands |
|---|---|
| `install` | `npm install -g aws-cdk`, `cd infra && npm ci`, `cd lambdas && pip install -r requirements-dev.txt` |
| `pre_build` | `cd lambdas && pytest --tb=short -q` — failing test blocks deployment |
| `build` | `cd infra && npm run build && npx cdk synth`, then `npx cdk deploy portfolio-dev-AppStack` |

**Pending (TK-18 — after frontend is scaffolded):**

| Phase | Commands to add |
|---|---|
| `install` | `cd front && npm ci` |
| `pre_build` | `cd front && npm run test -- --run` |
| `build` | `cd front && npm run build` |
| `post_build` | `aws s3 sync front/dist s3://$FRONTEND_BUCKET --delete`, `aws cloudfront create-invalidation` |

---

## CodeDeploy — Lambda Traffic Shifting

Every Lambda deployment goes through CodeDeploy. API Gateway always calls the `live` alias — CodeDeploy shifts traffic from the old version to the new one.

| Environment | Strategy | Behavior |
|---|---|---|
| `dev` | All-at-once | Instant shift — fast feedback |
| `staging` | Linear 10% every 1 minute | Gradual shift over ~10 minutes |
| `prod` | Canary 10% for 5 minutes | 10% of traffic for 5 minutes, then 100% |

If the CloudWatch error alarm fires during the shift, CodeDeploy automatically rolls back to the previous version.

---

## Rollback

### Automatic rollback (CodeDeploy)

CodeDeploy monitors the error alarm attached to each Lambda deployment group. If errors exceed the threshold during a deployment, CodeDeploy rolls back to the previous Lambda version automatically — no manual action needed.

### Manual rollback (Lambda alias)

To manually point the `live` alias back to a previous version:

```bash
# List available versions
aws lambda list-versions-by-function \
  --function-name portfolio-dev-projects \
  --profile portfolio-dev

# Update the alias to point to a specific version
aws lambda update-alias \
  --function-name portfolio-dev-projects \
  --name live \
  --function-version <version-number> \
  --profile portfolio-dev
```

### Infrastructure rollback (CloudFormation)

To roll back an `AppStack` deployment to the previous CloudFormation state:

```bash
aws cloudformation cancel-update-stack \
  --stack-name portfolio-dev-AppStack \
  --profile portfolio-dev
```

Or redeploy the previous commit:

```bash
git revert HEAD
git push origin dev
```

This triggers the pipeline with the reverted code.

---

## CloudFront Cache Invalidation

After deploying a new frontend build to S3, CloudFront must be invalidated so users receive the updated files. This will be automated in `buildspec.yml` after TK-18.

Manual invalidation:

```bash
aws cloudfront create-invalidation \
  --distribution-id <frontend-distribution-id> \
  --paths "/*" \
  --profile portfolio-dev
```

The distribution ID is available in the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name portfolio-dev-AppStack \
  --query "Stacks[0].Outputs[?ExportName=='portfolio-dev-frontend-distribution-id'].OutputValue" \
  --output text \
  --profile portfolio-dev
```

---

## Reading CloudFormation Outputs

All key resource identifiers are exported as CloudFormation outputs. To read them:

```bash
aws cloudformation describe-stacks \
  --stack-name portfolio-dev-AppStack \
  --query "Stacks[0].Outputs" \
  --output table \
  --profile portfolio-dev
```

Key exports:

| Export name | Description |
|---|---|
| `portfolio-dev-user-pool-id` | Cognito User Pool ID |
| `portfolio-dev-user-pool-client-id` | Cognito App Client ID |
| `portfolio-dev-table-name` | DynamoDB table name |
| `portfolio-dev-api-url` | API Gateway base URL |
| `portfolio-dev-frontend-url` | CloudFront URL for the frontend |
| `portfolio-dev-frontend-distribution-id` | CloudFront distribution ID (for invalidation) |
| `portfolio-dev-media-url` | CloudFront URL for media files |
| `portfolio-dev-frontend-bucket` | Frontend S3 bucket name |
| `portfolio-dev-media-bucket` | Media S3 bucket name |

---

## Tailing Lambda Logs

```bash
aws logs tail /aws/lambda/portfolio-dev-projects \
  --follow \
  --profile portfolio-dev
```

Replace `projects` with any domain: `profile`, `experience`, `skills`, `certifications`, `media`, `contact`.

---

**Last Updated:** 2026-05-11
**Status:** Initial draft
**Next:** Finalize in Phase 3 — add staging/prod deployment, advanced rollback, and troubleshooting
