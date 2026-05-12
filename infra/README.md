# infra/

AWS CDK infrastructure for the Portfolio CRM project.

---

## Structure

```text
infra/
├── bin/
│   └── app.ts                    # CDK entry point — defines all stacks
├── lib/
│   ├── app-stack.ts              # Main application stack
│   ├── app-stage.ts              # Deployment stage wrapper
│   ├── pipeline-stack.ts         # CI/CD pipeline stack (dev and prod)
│   └── constructs/
│       ├── auth.ts               # Cognito User Pool and app client
│       ├── database.ts           # DynamoDB table and GSIs
│       ├── lambdas.ts            # Lambda functions, aliases, CodeDeploy
│       ├── api.ts                # API Gateway REST API and Cognito authorizer
│       ├── frontend-hosting.ts   # S3 buckets and CloudFront distributions
│       ├── monitoring.ts         # CloudWatch alarms and dashboards
│       ├── security.ts           # IAM, Parameter Store, KMS (placeholder)
│       └── async-processing.ts   # SQS, DLQ, EventBridge (placeholder)
└── config/
    ├── dev.ts                    # Dev environment settings
    ├── staging.ts                # Staging settings (not used — kept for reference)
    └── prod.ts                   # Prod environment settings
```

---

## Stacks

| Stack | Command | Description |
|---|---|---|
| `portfolio-dev-AppStack` | `npx cdk deploy portfolio-dev-AppStack` | All dev resources |
| `portfolio-prod-AppStack` | `npx cdk deploy portfolio-prod-AppStack` | All prod resources |
| `portfolio-dev-PipelineStack` | `npx cdk deploy portfolio-dev-PipelineStack` | Dev CI/CD pipeline (deploy once) |
| `portfolio-prod-PipelineStack` | `npx cdk deploy portfolio-prod-PipelineStack` | Prod CI/CD pipeline (deploy once) |

---

## Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Preview changes
npx cdk diff portfolio-dev-AppStack

# Deploy dev stack
npx cdk deploy portfolio-dev-AppStack

# Deploy prod stack
npx cdk deploy portfolio-prod-AppStack

# Synthesize CloudFormation templates
npx cdk synth
```

---

## Pipeline Setup (one time)

Before deploying the pipeline stacks, set these Parameter Store values:

```bash
aws ssm put-parameter --name /portfolio/pipeline/github-owner --value "AndresAlvarez564" --type String
aws ssm put-parameter --name /portfolio/pipeline/github-repo  --value "Portfolio" --type String
aws ssm put-parameter --name /portfolio/pipeline/github-connection-arn --value "<arn>" --type String
```

The GitHub connection ARN is created in **AWS Console → Developer Tools → Connections**.

---

## Environment Differences

| Setting | Dev | Prod |
|---|---|---|
| Removal Policy | DESTROY | RETAIN |
| DynamoDB PITR | Disabled | Enabled |
| Lambda Memory | 256 MB | 512 MB |
| Lambda Timeout | 10s | 15s |
| CodeDeploy | All-at-once | Canary 10% / 5 min |
| Log Retention | 1 month | 12 months |
