# Reusable AWS Serverless Project Configuration Standard

This document defines a reusable technical configuration standard for AWS serverless projects using React, Cognito, API Gateway, Lambda, DynamoDB, S3, CloudFront, and AWS CDK.

This file is designed to be reused across multiple projects.

It should contain stable rules, naming conventions, folder structures, infrastructure patterns, and default technical decisions.

Project-specific explanations should not go here. Project-specific notes should go inside `docs/project-settings/`.

---

## 1. Purpose of This File

`docs/config.md` is the main reusable configuration standard for the project.

Use this file to define:

- Project naming rules
- AWS service defaults
- CDK structure
- Lambda structure
- DynamoDB rules
- API Gateway rules
- Frontend rules
- Security defaults
- Monitoring defaults
- CI/CD rules
- Error handling rules
- Testing rules
- Developer setup rules
- Documentation rules
- Ticket rules

This file can be copied and adapted for other projects.

---

## 2. Project Variables

Use placeholders when writing reusable configuration.

| Variable | Description | Example |
|---|---|---|
| `<project-name>` | Short project name | `crm`, `inventory`, `portal` |
| `<stage>` | Environment name | `dev`, `staging`, `prod` |
| `<region>` | AWS region | `us-east-1` |
| `<account-id>` | AWS account ID | `123456789012` |
| `<domain>` | Business module name | `users`, `products`, `orders` |
| `<entity>` | Data entity name | `user`, `product`, `order` |
| `<lambda-name>` | Lambda function domain name | `users`, `projects`, `reports` |
| `<table-name>` | DynamoDB table name | `main`, `users`, `inventory` |

---

## 3. Global Naming Rules

All AWS resources should follow predictable names.

| Resource | Pattern | Example |
|---|---|---|
| Lambda | `<project-name>-<stage>-<domain>` | `crm-prod-users` |
| DynamoDB Table | `<project-name>-<stage>-<entity>` | `crm-prod-main` |
| API Gateway | `<project-name>-<stage>-api` | `crm-prod-api` |
| Cognito User Pool | `<project-name>-<stage>-user-pool` | `crm-prod-user-pool` |
| Cognito App Client | `<project-name>-<stage>-client` | `crm-prod-client` |
| S3 Frontend Bucket | `<project-name>-<stage>-frontend-<account-id>` | `crm-prod-frontend-123456789012` |
| CloudFront Distribution | `<project-name>-<stage>-distribution` | `crm-prod-distribution` |
| SQS Queue | `<project-name>-<stage>-<purpose>-queue` | `crm-prod-jobs-queue` |
| SQS DLQ | `<project-name>-<stage>-<purpose>-dlq` | `crm-prod-jobs-dlq` |
| CodePipeline | `<project-name>-pipeline` | `crm-pipeline` |
| CodeBuild Project | `<project-name>-<stage>-build` | `crm-prod-build` |
| CloudWatch Alarm | `<project-name>-<stage>-<resource>-<metric>-alarm` | `crm-prod-users-errors-alarm` |

Rules:

- Use lowercase names when possible.
- Use hyphens instead of spaces.
- Always include the project name.
- Always include the stage for environment-specific resources.
- Avoid random names unless AWS requires uniqueness.

---

## 4. Repository Structure Standard

Recommended root structure:

```text
/
├── front/
├── lambdas/
├── infra/
├── docs/
└── README.md
```

Purpose of each folder:

| Folder | Purpose |
|---|---|
| `front/` | React frontend application |
| `lambdas/` | Python Lambda backend code |
| `infra/` | AWS CDK infrastructure code |
| `docs/` | Reusable configuration, project settings, and tickets |
| `README.md` | Main project introduction and setup guide |

---

## 5. Documentation Structure Standard

Recommended documentation structure:

```text
docs/
├── config.md
├── context.md
├── project-settings/
│   ├── architecture.md
│   ├── cdk.md
│   ├── frontend.md
│   ├── backend.md
│   ├── database.md
│   ├── security.md
│   ├── monitoring.md
│   └── deployment.md
└── tickets/
    ├── TK-01.md
    ├── TK-02.md
    └── TK-03.md
```

Rules:

- `config.md` contains reusable technical standards.
- `context.md` contains the project identity, business rules, key entities, and current status. Paste it at the start of any AI chat session to give full context without re-explaining the project.
- `project-settings/` contains human-language explanations for the current project.
- `tickets/` contains pending tasks, bugs, improvements, and implementation notes.
- Do not store secrets, passwords, API keys, AWS access keys, or real production credentials inside `/docs`.

---

## 6. CDK Structure Standard

Recommended CDK structure:

```text
infra/
├── bin/
│   └── app.ts
├── lib/
│   ├── app-stack.ts
│   ├── app-stage.ts
│   ├── pipeline-stack.ts
│   └── constructs/
│       ├── auth.ts
│       ├── database.ts
│       ├── lambdas.ts
│       ├── api.ts
│       ├── frontend-hosting.ts
│       ├── monitoring.ts
│       ├── security.ts
│       └── async-processing.ts
├── config/
│   ├── dev.ts
│   ├── staging.ts
│   └── prod.ts
├── cdk.json
└── package.json
```

Purpose of each CDK file:

| File | Purpose |
|---|---|
| `bin/app.ts` | CDK entry point |
| `lib/app-stack.ts` | Main application infrastructure stack |
| `lib/app-stage.ts` | Deployment stage that wraps AppStack |
| `lib/pipeline-stack.ts` | CI/CD infrastructure stack |
| `lib/constructs/auth.ts` | Cognito configuration |
| `lib/constructs/database.ts` | DynamoDB configuration |
| `lib/constructs/lambdas.ts` | Lambda configuration and permissions |
| `lib/constructs/api.ts` | API Gateway configuration |
| `lib/constructs/frontend-hosting.ts` | S3 and CloudFront configuration |
| `lib/constructs/monitoring.ts` | CloudWatch logs, alarms, and dashboards |
| `lib/constructs/security.ts` | WAF, KMS, secrets, parameters, and security controls |
| `lib/constructs/async-processing.ts` | SQS, DLQ, EventBridge, and Step Functions |
| `config/dev.ts` | Development environment settings — used by the `dev` branch |
| `config/staging.ts` | Staging environment settings — used by the `develop` branch |
| `config/prod.ts` | Production environment settings — used by the `main` branch |

---

## 7. Stack Standard

Recommended real CDK stacks:

```text
AppStack
PipelineStack
```

### AppStack

`AppStack` contains the real application infrastructure.

It may include:

- Cognito
- API Gateway
- Lambda
- DynamoDB
- S3
- CloudFront
- CloudWatch
- WAF
- SQS
- Secrets Manager
- Systems Manager Parameter Store
- KMS

### PipelineStack

`PipelineStack` contains the CI/CD infrastructure.

It may include:

- CodePipeline
- CodeBuild
- GitHub connection
- Deployment stages
- Pipeline IAM roles
- Pipeline artifact bucket

Rules:

- Use `AppStack` for application resources.
- Use `PipelineStack` for CI/CD resources.
- Do not create one stack per AWS service at the beginning.
- Use constructs inside `AppStack` to keep code modular.

---

## 8. Construct Standard

Constructs are reusable infrastructure modules inside `AppStack`.

| Construct | Responsibility |
|---|---|
| `AuthConstruct` | Cognito User Pool, App Client, groups |
| `DatabaseConstruct` | DynamoDB tables and indexes |
| `LambdasConstruct` | Lambda functions and permissions |
| `ApiConstruct` | API Gateway resources, methods, integrations, authorizers |
| `FrontendHostingConstruct` | S3 frontend bucket and CloudFront distribution |
| `MonitoringConstruct` | CloudWatch alarms, dashboards, and metrics |
| `SecurityConstruct` | WAF, KMS, secrets, parameters, and security controls |
| `AsyncProcessingConstruct` | SQS queues, DLQs, EventBridge, Step Functions |

Rules:

- Each construct should have one clear responsibility.
- A construct can return resources needed by another construct.
- Avoid circular dependencies between constructs.
- Keep construct files readable and focused.

Example dependency flow:

```text
DatabaseConstruct
returns → DynamoDB table

LambdasConstruct
receives → DynamoDB table
returns → Lambda functions

ApiConstruct
receives → Lambda functions + Cognito User Pool
returns → API Gateway

MonitoringConstruct
receives → Lambda functions + API Gateway

FrontendHostingConstruct
returns → S3 bucket + CloudFront distribution
```

---

## 9. Environment Standard

Recommended environments:

```text
dev
staging
prod
```

Default behavior:

| Environment | Removal Policy | DynamoDB PITR | WAF | Monitoring | Purpose |
|---|---|---|---|---|---|
| `dev` | `DESTROY` | Disabled | Disabled | Basic | Development and testing |
| `staging` | `RETAIN` | Enabled | Optional | Enabled | Pre-production validation |
| `prod` | `RETAIN` | Enabled | Enabled | Enabled | Real users and production data |

Example environment config:

```ts
export const devConfig = {
  projectName: "myapp",
  stage: "dev",
  region: "us-east-1",
  removalPolicy: "destroy",
  enablePitr: false,
  enableWaf: false,
  lambdaMemory: 256,
  lambdaTimeoutSeconds: 10,
};
```

```ts
export const stagingConfig = {
  projectName: "myapp",
  stage: "staging",
  region: "us-east-1",
  removalPolicy: "retain",
  enablePitr: true,
  enableWaf: false,
  lambdaMemory: 512,
  lambdaTimeoutSeconds: 15,
};
```

```ts
export const prodConfig = {
  projectName: "myapp",
  stage: "prod",
  region: "us-east-1",
  removalPolicy: "retain",
  enablePitr: true,
  enableWaf: true,
  lambdaMemory: 512,
  lambdaTimeoutSeconds: 15,
};
```

Rules:

- Do not use production data in development.
- Production should use stricter security and retention settings.
- Development can use lower-cost settings.
- Environment-specific values should live in `infra/config/`.

---

## 10. Frontend Standard

Recommended frontend stack:

- React
- Vite
- TypeScript
- Ant Design
- React Router DOM
- AWS Amplify v6
- Amplify REST API client

Recommended frontend structure:

```text
front/
└── src/
    ├── config/
    ├── constants/
    ├── context/
    ├── hooks/
    ├── services/
    ├── components/
    ├── pages/
    └── types/
```

Purpose:

| Folder | Purpose |
|---|---|
| `config/` | Amplify and frontend environment configuration |
| `constants/` | Shared labels, statuses, colors, fixed values |
| `context/` | Global React contexts such as AuthContext |
| `hooks/` | Custom hooks with state and handlers |
| `services/` | API service functions |
| `components/` | Reusable UI components |
| `pages/` | High-level route pages |
| `types/` | TypeScript interfaces and types |

Rules:

- Pages should contain high-level JSX only.
- Business logic should move to hooks.
- API calls should move to services.
- Shared UI should move to components.
- Do not store secrets in frontend environment variables.
- Frontend role checks are for UI only, not real authorization.

Recommended file size limits:

| File Type | Suggested Limit |
|---|---|
| `pages/*.tsx` | Around 100 lines |
| `components/**/*.tsx` | Around 150 lines |
| `hooks/*.ts` | Around 200 lines |
| `services/*.ts` | Around 80 lines |

---

## 11. Frontend Hosting Standard

Recommended hosting:

```text
User
↓
CloudFront
↓
Private S3 frontend bucket
```

Rules:

- The S3 bucket must be private.
- CloudFront must be the public entry point.
- HTTP should redirect to HTTPS.
- React Router should fallback to `index.html`.
- CloudFront should be invalidated after frontend deployment.
- Do not expose the S3 website endpoint directly.

Recommended resources:

- S3 bucket
- CloudFront distribution
- CloudFront Origin Access Control
- S3 bucket deployment
- CloudFront invalidation

---

## 12. Backend Lambda Standard

Recommended Lambda runtime:

```text
Python 3.12
```

Recommended Lambda folder pattern:

```text
lambdas/<domain>/
├── handler.py
├── routes/
└── utils/
```

Example:

```text
lambdas/users/
├── handler.py
├── routes/
│   ├── users.py
│   └── permissions.py
└── utils/
    ├── auth.py
    └── response.py
```

Rules:

- `handler.py` should only route requests.
- Business logic should live inside `routes/`.
- Reusable helpers should live inside `utils/`.
- Each Lambda should represent a business domain.
- Avoid one giant Lambda for the entire application.
- Avoid splitting route files only by HTTP method.
- Use structured logs.
- Use X-Ray tracing when possible.
- Use environment variables only for non-sensitive configuration.
- Use Secrets Manager for sensitive secrets.

Recommended Lambda environment variables:

| Variable | Purpose |
|---|---|
| `STAGE` | Current environment |
| `TABLE_NAME` | DynamoDB table name |
| `LOG_LEVEL` | Logging level |
| `POWERTOOLS_SERVICE_NAME` | Lambda Powertools service name |

Recommended defaults:

| Setting | Dev | Prod |
|---|---|---|
| Memory | 256 MB | 512 MB or more |
| Timeout | 10 seconds | 15 seconds or more |
| Architecture | ARM64 | ARM64 |
| Tracing | Active | Active |
| Log retention | 1 month | 3 to 12 months |

Note on timeout:

- 10–15 seconds is enough for standard CRUD operations.
- Increase the timeout when the Lambda calls external APIs, processes files, or runs complex queries.
- For file processing or third-party integrations, consider 30–60 seconds or move the task to an async SQS worker.

---

## 13. API Gateway Standard

Recommended API type:

```text
API Gateway REST API
```

Recommended authorization:

```text
Cognito Authorizer
```

Default configuration:

| Setting | Recommended Value |
|---|---|
| API type | REST API |
| Authorization | Cognito Authorizer |
| Metrics | Enabled |
| Tracing | Enabled |
| CORS | Configured |
| Stage name | `<stage>` |

Rules:

- Private endpoints must use Cognito Authorizer.
- Public endpoints should be intentionally separated.
- Admin endpoints must never depend only on frontend validation.
- Backend Lambda functions must validate permissions.
- API routes should be grouped by business resource.

Example route pattern:

```text
/users
/users/{id}
/projects
/projects/{id}
/projects/{id}/stages
```

---

## 14. Authentication and Authorization Standard

Recommended authentication service:

```text
Amazon Cognito User Pool
```

Recommended configuration:

| Setting | Recommended Value |
|---|---|
| Self sign-up | Disabled for internal systems |
| Login | Username or email depending on project |
| App client auth flow | `USER_PASSWORD_AUTH` and/or SRP |
| API token | ID token |
| Role model | Cognito groups |

Recommended groups:

```text
admin
manager
viewer
```

Rules:

- Use Cognito groups for roles.
- The frontend can hide UI elements based on role.
- The backend must enforce real authorization.
- If a user should not see data, the backend must not send that data.
- Do not rely only on frontend validation.

---

## 15. DynamoDB Standard

Recommended billing mode:

```text
PAY_PER_REQUEST
```

Recommended table design:

```text
Primary key: pk
Sort key: sk
```

Recommended production setting:

```text
Point-in-Time Recovery: enabled
```

Rules:

- Use `Query` instead of `Scan` whenever possible.
- Create GSIs based on real access patterns.
- Use pagination with `Limit` and `ExclusiveStartKey`.
- Avoid `Scan + FilterExpression` in production.
- Store item type using an `entityType` attribute.
- Keep access patterns documented in `docs/project-settings/database.md`.

Example generic item pattern:

```text
pk = USER#<user-id>
sk = PROFILE

entityType = USER
```

Example GSI patterns:

| GSI | Partition Key | Sort Key | Purpose |
|---|---|---|---|
| `gsi-entity-type` | `entityType` | `createdAt` | List entities by type |
| `gsi-status` | `status` | `updatedAt` | List entities by status |
| `gsi-owner` | `ownerId` | `createdAt` | List records by owner |

---

## 16. Security Standard

Required rules:

- Use least privilege IAM.
- Do not commit `.env` files.
- Do not store secrets inside `/docs`.
- Do not store AWS access keys in the repository.
- Use Secrets Manager for sensitive secrets.
- Use Systems Manager Parameter Store for normal configuration.
- Use WAF in production.
- Keep the S3 frontend bucket private.
- Use CloudFront as the public entry point.
- Use HTTPS only.
- Use backend authorization for sensitive data.

Recommended services:

| Service | Purpose |
|---|---|
| IAM | Permissions and least privilege |
| Cognito | Authentication and user groups |
| WAF | Web protection for CloudFront/API |
| Secrets Manager | Sensitive secrets |
| Parameter Store | Non-sensitive configuration |
| KMS | Encryption keys when needed |

---

## 17. Monitoring Standard

Recommended services:

- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Alarms
- CloudWatch Dashboards
- AWS X-Ray
- AWS Lambda Powertools for Python

Required monitoring:

| Resource | Metrics |
|---|---|
| Lambda | Errors, duration, throttles, invocations |
| API Gateway | 4XX errors, 5XX errors, latency |
| DynamoDB | Throttled requests, failed requests |
| CloudFront | Error rate, requests, cache behavior |
| CodePipeline | Failed executions |
| CodeBuild | Failed builds |

Recommended alarms:

- Lambda error alarm
- Lambda duration alarm
- Lambda throttle alarm
- API Gateway 5XX alarm
- API Gateway latency alarm
- DynamoDB throttling alarm
- CodePipeline failed execution alarm
- CodeBuild failed build alarm

Rules:

- Production must have alarms.
- Every Lambda must have an error and duration alarm — enforced per feature ticket in section 26.
- Logs should be structured.
- Use request IDs for debugging.
- Use X-Ray for tracing important backend flows.
- Use dashboards for production systems.

---

## 18. Async Processing Standard

Recommended services:

- Amazon SQS
- SQS Dead-Letter Queue
- EventBridge Scheduler
- Step Functions

Use async processing when a task does not need to finish during the API request.

Example use cases:

| Service | Use Case |
|---|---|
| SQS | Emails, reports, file processing, notifications |
| DLQ | Failed background jobs |
| EventBridge Scheduler | Daily jobs, reminders, scheduled updates |
| Step Functions | Multi-step workflows, approvals, retries |

Rules:

- Do not process slow jobs directly inside API requests.
- Use SQS for background tasks.
- Use a DLQ for failed jobs.
- Use worker Lambdas for queue processing.
- Use Step Functions when the workflow has multiple steps or retries.

---

## 19. CI/CD Standard

Recommended services:

- GitHub
- AWS CodePipeline
- AWS CodeBuild
- AWS CodeDeploy for Lambda

Recommended flow:

```text
GitHub
↓
CodePipeline
↓
CodeBuild
↓
Install dependencies
↓
Run tests
↓
Build frontend
↓
CDK synth
↓
Deploy AppStage
↓
Deploy AppStack
```

Rules:

- `PipelineStack` is deployed manually one time.
- After that, CodePipeline deploys the application automatically.
- The pipeline should build the frontend.
- The pipeline should synthesize the CDK app.
- The pipeline should deploy `AppStage`.
- `AppStage` should contain `AppStack`.
- Frontend files should be uploaded to S3.
- CloudFront should be invalidated after frontend deployment.

Recommended commands for synth step:

```bash
npm ci
cd front && npm ci && npm run build && cd ..
cd infra && npm ci && npm run build && npx cdk synth
```

Rules for secrets in the build:

- Do not hardcode secrets in `buildspec.yml` or environment variables.
- CodeBuild should read secrets from AWS Secrets Manager or Parameter Store at build time.
- Use CodeBuild IAM role permissions to access secrets, not static credentials.

---

## 20. CodeDeploy for Lambda Standard

Use CodeDeploy for Lambda in all projects, including small ones.

Practicing CodeDeploy on small projects builds the habit and the skill before it matters in production. The setup cost is low, and the benefit of safe deployments with automatic rollback applies at any scale.

Recommended flow:

```text
Lambda Function
↓
Lambda Version
↓
Lambda Alias: live
↓
CodeDeploy Deployment Group
↓
CloudWatch Alarms for rollback
```

Recommended deployment strategy:

| Environment | Strategy | Reason |
|---|---|---|
| dev | All-at-once | Fast feedback, no real users |
| staging | Linear10PercentEvery1Minute | Validates behavior before prod |
| prod | Canary10Percent5Minutes | Safe rollout with automatic rollback |

Rules:

- Use CodeDeploy for Lambda in every project, even small ones.
- Use Lambda versions and aliases to enable traffic shifting.
- Always attach CloudWatch alarms to the deployment group for automatic rollback.
- Use the `live` alias as the stable pointer that API Gateway and other services call.
- Never point API Gateway directly to `$LATEST`.
- Practicing on small projects prepares the team for production deployments where failures have real impact.

Example CDK pattern:

```ts
const version = fn.currentVersion;

const alias = new lambda.Alias(this, "LiveAlias", {
  aliasName: "live",
  version,
});

new codedeploy.LambdaDeploymentGroup(this, "DeploymentGroup", {
  alias,
  deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
  alarms: [errorAlarm],
});
```

---

## 21. Cost Control Standard

Recommended services and practices:

- AWS Budgets
- Billing alerts
- Cost allocation tags
- Serverless-first architecture
- PAY_PER_REQUEST for DynamoDB at the beginning
- S3 lifecycle rules when needed
- CloudWatch log retention limits

Recommended tags:

| Tag | Example |
|---|---|
| `Project` | `crm` |
| `Environment` | `dev`, `staging`, `prod` |
| `Owner` | `team-name` |
| `ManagedBy` | `CDK` |
| `Client` | `client-name` |

Rules:

- Add cost tags to all possible resources.
- Configure AWS Budgets for production accounts.
- Avoid unlimited log retention.
- Avoid unnecessary always-on resources.
- Review costs before adding RDS, ECS, EKS, or EC2.

---

## 22. Services Not Recommended by Default

Do not add these services unless the project specifically requires them.

| Service | Reason |
|---|---|
| EC2 | Not needed for a serverless app by default |
| ECS | Only needed for containers |
| EKS | Too complex unless Kubernetes is required |
| RDS | Only needed for relational database requirements |
| Elastic Beanstalk | Not necessary when using CDK and Lambda |
| App Runner | Useful for containers, but not required for this stack |

Default recommendation:

```text
Use serverless services first.
Add server-based or container-based services only when the project requires them.
```

---

## 23. Error Handling Standard

Every Lambda must return a consistent response shape. The frontend must handle errors using the same structure every time.

### Lambda Response Shape

All Lambda responses must follow this structure:

```python
# Success
{
    "statusCode": 200,
    "body": json.dumps({
        "data": { ... }
    })
}

# Error
{
    "statusCode": 400,
    "body": json.dumps({
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "The ID number field is required."
        }
    })
}
```

Rules:

- Always return `data` on success, never return the payload at the root level.
- Always return `error.code` and `error.message` on failure.
- `error.code` must be a machine-readable uppercase string.
- `error.message` must be a human-readable string safe to show in the UI.
- Never expose stack traces, internal exceptions, or AWS resource names in error responses.

### HTTP Status Codes

| Code | When to use |
|---|---|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST that creates a resource |
| `400` | Invalid input, missing required fields, business rule violation |
| `401` | Not authenticated — missing or invalid token |
| `403` | Authenticated but not authorized for this action |
| `404` | Resource not found |
| `409` | Conflict — duplicate record, uniqueness violation |
| `500` | Unexpected server error |

### Standard Error Codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Missing or invalid input field |
| `NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RECORD` | Uniqueness rule violated |
| `UNAUTHORIZED` | Token missing or invalid |
| `FORBIDDEN` | User does not have permission |
| `INTERNAL_ERROR` | Unexpected server error |

### Frontend Error Handling

Rules:

- Always read `error.code` to decide how to handle the error programmatically.
- Always show `error.message` to the user — it is safe to display.
- Never show raw HTTP status codes or exception messages to the user.
- Handle `401` globally — redirect to login.
- Handle `403` globally — show a permission denied message.
- Handle `409` at the form level — show the message inline near the conflicting field.
- Handle `500` globally — show a generic "something went wrong" message.

Example frontend service pattern:

```ts
try {
  const response = await apiClient.post("/clients", payload);
  return response.data;
} catch (error) {
  if (error.response?.data?.error) {
    throw error.response.data.error; // { code, message }
  }
  throw { code: "INTERNAL_ERROR", message: "Something went wrong." };
}
```

---

## 24. Testing Standard

Tests run in the CI/CD pipeline during the CodeBuild step. There is no local Lambda emulation — all integration testing happens against the dev environment in AWS.

### What to test

| Layer | Type | Tool |
|---|---|---|
| Lambda business logic | Unit tests | pytest |
| Lambda routes | Unit tests | pytest + moto |
| Frontend components | Component tests | Vitest + React Testing Library |
| Frontend hooks | Unit tests | Vitest |
| Frontend services | Unit tests | Vitest + mock fetch |

### Lambda test structure

```text
lambdas/<domain>/
├── handler.py
├── routes/
├── utils/
└── tests/
    ├── test_routes.py
    └── test_utils.py
```

Rules:

- Tests live inside the Lambda domain folder, not in a separate top-level `tests/` folder.
- Use `moto` to mock DynamoDB in unit tests — do not call real AWS resources in unit tests.
- Test the business logic in `routes/`, not the handler routing.
- Each route file should have a corresponding test file.

Example pytest test:

```python
import pytest
from moto import mock_dynamodb
from routes.clients import create_client

@mock_dynamodb
def test_create_client_duplicate_raises_conflict():
    # arrange: create existing client in mocked DynamoDB
    # act: call create_client with same ID number
    # assert: raises 409 conflict
    ...
```

### Frontend test structure

```text
front/src/
├── components/
│   └── ClientForm/
│       ├── ClientForm.tsx
│       └── ClientForm.test.tsx
├── hooks/
│   └── useClients.ts
│   └── useClients.test.ts
└── services/
    └── clientsService.ts
    └── clientsService.test.ts
```

Rules:

- Test files live next to the file they test.
- Test component rendering and user interactions, not implementation details.
- Test hooks with `renderHook` from React Testing Library.
- Mock API calls in service tests — do not call real endpoints in unit tests.

### Pipeline test step

The CodeBuild pipeline runs tests before deploying:

```bash
# Lambda tests
cd lambdas && pip install -r requirements-dev.txt && pytest

# Frontend tests
cd front && npm ci && npm run test -- --run
```

Rules:

- A failed test must block the deployment. Do not deploy with failing tests.
- Test coverage is not enforced by a threshold, but every route and every hook must have at least one test.
- Add tests in the same ticket as the feature. Do not create separate test tickets.

---

## 25. Developer Setup Standard

There is no local Lambda emulation. Development and testing happen against the AWS dev environment directly.

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x or later | CDK and frontend |
| Python | 3.12 | Lambda development |
| AWS CLI | v2 | AWS access |
| AWS CDK | latest | Infrastructure deployment |
| Git | latest | Version control |

Install CDK globally:

```bash
npm install -g aws-cdk
```

### AWS CLI Configuration

Configure a named profile for each environment:

```bash
aws configure --profile <project-name>-dev
aws configure --profile <project-name>-staging
aws configure --profile <project-name>-prod
```

Rules:

- Never use the default AWS profile for project work.
- Use named profiles per environment to avoid accidental prod deployments.
- Never store AWS credentials in the repository.

### Deploying to Dev

To deploy the full stack to the dev environment manually:

```bash
cd infra
npm ci
npm run build
npx cdk deploy --all --profile <project-name>-dev
```

To deploy a single construct for faster iteration:

```bash
npx cdk deploy <project-name>-dev-AppStack --profile <project-name>-dev
```

### Reading Logs During Development

Tail Lambda logs from CloudWatch:

```bash
aws logs tail /aws/lambda/<project-name>-dev-<domain> \
  --follow \
  --profile <project-name>-dev
```

Or use the AWS Console CloudWatch Logs Insights for more complex queries.

### Running the Frontend Locally

The frontend runs locally and points to the dev API Gateway URL:

```bash
cd front
npm ci
npm run dev
```

The dev API URL is configured in `front/src/config/` using the Amplify config. Make sure the dev environment is deployed before running the frontend locally.

Rules:

- Always deploy infra to dev before running the frontend locally.
- Never point the local frontend to staging or prod API URLs.
- Use the `dev` AWS profile for all manual deployments.
- If a Lambda change is needed, deploy to dev and test there — do not try to emulate locally.

---

## 26. Ticket Standard

Tickets should be stored in:

```text
docs/tickets/
```

Ticket naming pattern:

```text
TK-01.md
TK-02.md
TK-03.md
```

Ticket file naming uses the same ID as the ticket title for easy lookup.

---

### How the Ticket System Works

Every project follows the same three-phase structure:

```text
Phase 1 — Mandatory Opening Tickets
  Created at the start of every project.
  Cover architecture, design, flows, data model, and infrastructure setup.
  Must be completed before any feature development begins.
  These tickets are the same for every project.

        ↓

Phase 2 — Project Tickets
  Created by the person in charge of the project.
  Cover the actual features, business logic, and domain-specific work.
  Examples: login development, user creation, reports, notifications.
  These tickets are different for every project.

        ↓

Phase 3 — Mandatory Closing Tickets
  Created before going to staging or production.
  Cover security review, monitoring setup, cost configuration, and go-live plan.
  Must be completed before the first production deployment.
  These tickets are the same for every project.
```

This structure ensures that design and infrastructure decisions are made before development starts, and that security and monitoring are never skipped before going live.

---

### Ticket Types

| Priority | Type | Description | Must be done before |
|---|---|---|---|
| 1 | `Architecture` | System design, service selection, high-level decisions | Everything else |
| 2 | `Flow` | User flows, business process diagrams, sequence diagrams | Data model and implementation |
| 3 | `Data Model` | DynamoDB table design, access patterns, GSIs | Backend implementation |
| 4 | `Security` | Auth model, roles, permissions, WAF rules | Any protected endpoint |
| 5 | `Infrastructure` | CDK constructs, stacks, environments | Deployment |
| 6 | `Feature` | Application feature implementation | Depends on types above |
| 7 | `Bug` | Fix broken behavior | — |
| 8 | `Improvement` | Refactor, performance, cleanup | — |
| 9 | `Monitoring` | Alarms, dashboards, log structure | Production deployment |
| 10 | `Documentation` | Project settings, deployment guides | — |
| 11 | `Deployment` | Release steps, rollback plans | Feature completion |

---

### Ticket Template

Feature tickets cover a complete vertical slice: backend, frontend, and observability together.
This ensures that CloudWatch alarms, structured logs, and UI work are never left out of a feature.

```md
# TK-XX | Ticket title

## Type

Architecture | Flow | Data Model | Security | Infrastructure | Feature | Bug | Improvement | Monitoring | Documentation | Deployment

## Priority

High | Medium | Low

## Status

Open | In Progress | Blocked | Done

## Branch

feature/tk-xx-short-description → dev

## Merge Requirements

- [ ] All tasks completed and tested locally
- [ ] No secrets or credentials committed
- [ ] Tested in dev environment
- [ ] PR reviewed and approved
- [ ] No regressions in existing functionality

Note: for promotion tickets (`dev → develop` or `develop → main`), replace Merge Requirements with:

- [ ] All tickets in the current phase are Done
- [ ] Environment validated (dev or staging)
- [ ] No open blockers
- [ ] Release plan documented (for `develop → main` only)

## Depends On

- TK-01 (Flow: client registration flow)
- TK-03 (Data Model: clients table)

## Objective

Describe the purpose of the ticket. What problem it solves and why it is needed.

## Proposed Scope

- What exactly will be done.
- Which screens, endpoints, or resources are involved.
- What is explicitly out of scope for this ticket.

## Flow or Diagram

Include the process flow if the ticket involves business logic or a sequence of steps.

Example:

User fills out form
↓
Frontend calls POST /clients
↓
Lambda validates input and checks for duplicates
↓
Lambda saves record in DynamoDB
↓
Lambda returns 201

## Tasks

### Backend
- [ ] Lambda route implemented
- [ ] Input validation and error handling
- [ ] DynamoDB access pattern working
- [ ] Correct HTTP response codes returned using standard error shape
- [ ] Authorization check applied
- [ ] Unit tests written for the route logic

### Frontend
- [ ] UI component or page built
- [ ] API service call connected
- [ ] Loading state handled
- [ ] Error state handled using standard error shape (`error.code` and `error.message`)
- [ ] Role-based visibility applied if needed
- [ ] Component or hook tests written

### Observability
- [ ] CloudWatch alarm created for this Lambda (errors and duration)
- [ ] Structured logs added with relevant context fields
- [ ] X-Ray tracing verified for this flow

### Documentation
- [ ] Relevant `project-settings/` file updated if this ticket changes behavior or structure

## Acceptance Criteria

- The feature works correctly according to the defined scope.
- Validation messages are clear to the user.
- The implementation does not affect existing records.
- No secrets or sensitive data are exposed.
- CloudWatch alarm exists for the Lambda involved.
- Relevant documentation is up to date.

## Notes

Add technical notes, edge cases, decisions made, or open questions here.
```

---

### Real Example — TK-22 (Phase 2 feature ticket)

```md
# TK-22 | Update client interface to display ID number and enforce uniqueness rule

## Type

Feature

## Priority

High

## Status

Done

## Branch

feature/tk-22-client-id-uniqueness → dev

## Merge Requirements

- [x] All tasks completed and tested locally
- [x] No secrets or credentials committed
- [x] Tested in dev environment
- [x] PR reviewed and approved
- [x] No regressions in existing functionality

## Depends On

- TK-03 (Data Model: clients table with ID number field)
- TK-04 (Security: uniqueness rule by ID number and project)

## Objective

Update the clients module to display the ID number in the interface and reinforce the
business validations needed to preserve record integrity within the project.

## Proposed Scope

- Show the client ID number in listings, detail views, and relevant forms.
- Enforce the integrity validation defined for ID number and project.
- Prevent duplicate records according to the agreed business rule.
- Ensure the user experience is clear when registering or looking up clients.

## Flow or Diagram

User attempts to register a client
↓
Frontend sends ID number + project to the backend
↓
Lambda checks if a client with the same ID number exists in the same project
↓
If exists → returns 409 error with a clear message
If not exists → saves the record and returns 201

## Tasks

### Backend
- [x] Add ID number field to the Lambda route for client creation
- [x] Validate that ID number is present and correctly formatted
- [x] Query DynamoDB to check for existing client with same ID number + project
- [x] Return 409 with a clear error message if duplicate is found
- [x] Return 201 on successful creation

### Frontend
- [x] Add ID number column to the client list table
- [x] Show ID number in the client detail view
- [x] Add ID number field to the registration and edit form
- [x] Show validation error message when duplicate is detected
- [x] Verify that existing records display correctly

### Observability
- [x] CloudWatch alarm created for clients Lambda errors
- [x] Structured log added when duplicate is detected (log level: WARNING)
- [x] X-Ray trace verified for the client creation flow

### Documentation
- [x] Updated `backend.md` to document the uniqueness rule for client registration

## Acceptance Criteria

- The ID number is displayed correctly in the client interface.
- The system blocks duplicates according to the current business rule.
- Validation messages are clear to the user.
- The feature does not affect existing records.
- CloudWatch alarm exists for the clients Lambda.
- `backend.md` reflects the uniqueness rule.

## Notes

- The uniqueness rule is by ID number + project, not by ID number alone globally.
- The ID number field already exists in DynamoDB since TK-03.
```

---

### Phase 1 — Mandatory Opening Tickets

These tickets are required for every project.
Create and complete them before writing any feature code.
They cover architecture, design, flows, data model, and infrastructure.

#### Group A — Architecture and Design

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-01` | Architecture | Define overall system architecture and AWS services | `feature/tk-01-architecture` → `dev` |
| `TK-02` | Flow | Map all user flows and business processes | `feature/tk-02-flows` → `dev` |
| `TK-03` | Data Model | Design DynamoDB table, keys, and access patterns | `feature/tk-03-data-model` → `dev` |
| `TK-04` | Security | Define roles, Cognito groups, and authorization rules | `feature/tk-04-security-model` → `dev` |
| `TK-05` | Documentation | Create initial draft of `architecture.md` | `feature/tk-05-architecture-draft` → `dev` |
| `TK-06` | Documentation | Create initial draft of `database.md` | `feature/tk-06-database-draft` → `dev` |

Documents started in Group A:

| Document | Action |
|---|---|
| `architecture.md` | Create initial draft (TK-05) |
| `database.md` | Create initial draft (TK-06) |

#### Group B — Infrastructure Setup

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-07` | Infrastructure | Set up CDK project structure and dev/staging/prod environments | `feature/tk-07-cdk-setup` → `dev` |
| `TK-08` | Infrastructure | Create Cognito User Pool and app client | `feature/tk-08-cognito` → `dev` |
| `TK-09` | Infrastructure | Create DynamoDB table with GSIs | `feature/tk-09-dynamodb` → `dev` |
| `TK-10` | Infrastructure | Create API Gateway with Cognito authorizer | `feature/tk-10-api-gateway` → `dev` |
| `TK-11` | Infrastructure | Create Lambda functions, IAM permissions, and test structure | `feature/tk-11-lambdas` → `dev` |
| `TK-12` | Infrastructure | Create S3 bucket and CloudFront distribution | `feature/tk-12-hosting` → `dev` |
| `TK-13` | Infrastructure | Set up CodePipeline and CodeBuild | `feature/tk-13-pipeline` → `dev` |
| `TK-14` | Infrastructure | Configure CodeDeploy for Lambda with aliases and alarms | `feature/tk-14-codedeploy` → `dev` |
| `TK-15` | Documentation | Write `cdk.md` — CDK structure, stacks, constructs, and environment config | `feature/tk-15-cdk-docs` → `dev` |
| `TK-16` | Documentation | Write `backend.md` — Lambda modules, routes, and initial structure | `feature/tk-16-backend-docs` → `dev` |
| `TK-17` | Documentation | Create initial draft of `deployment.md` — pipeline setup and deploy steps so far | `feature/tk-17-deployment-draft` → `dev` |

Documents started or completed in Group B:

| Document | Action |
|---|---|
| `cdk.md` | Write complete — CDK is stable after this group (TK-15) |
| `backend.md` | Create initial draft — will be updated per feature in Phase 2 (TK-16) |
| `deployment.md` | Create initial draft — pipeline and basic deploy steps, will be finalized in Phase 3 (TK-17) |

#### Group C — Frontend Foundation

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-18` | Infrastructure | Scaffold React + Vite + TypeScript + Ant Design project | `feature/tk-18-frontend-scaffold` → `dev` |
| `TK-19` | Infrastructure | Configure Amplify and Cognito authentication in the frontend | `feature/tk-19-amplify-auth` → `dev` |
| `TK-20` | Feature | Implement login, logout, and session handling | `feature/tk-20-login` → `dev` |
| `TK-21` | Feature | Implement role-based route protection | `feature/tk-21-route-protection` → `dev` |
| `TK-22` | Documentation | Write `frontend.md` — frontend structure, Amplify config, and auth flow | `feature/tk-22-frontend-docs` → `dev` |

Documents started or completed in Group C:

| Document | Action |
|---|---|
| `frontend.md` | Write complete — frontend foundation is stable after this group (TK-22) |

Rules for Phase 1:

- Do not start any project ticket until TK-01 through TK-06 are done.
- Do not start feature development until TK-07 through TK-22 are done.
- All Phase 1 branches target `dev`, not `develop`.
- Write documentation tickets as you build, not after. The knowledge is freshest during implementation.
- Documents marked "initial draft" will be updated during Phase 2 as features are added.
- Phase 1 tickets are the same for every project. Do not skip them.

---

### Phase 2 — Project Tickets

These tickets are created by the person in charge of the project.
They cover the actual features and business logic specific to the project.
They start at `TK-23` and go as high as needed.

Examples of project tickets:

| Ticket | Type | Example Title | Branch |
|---|---|---|---|
| `TK-23` | Feature | User creation and management | `feature/tk-23-user-management` → `dev` |
| `TK-24` | Feature | Client registration form | `feature/tk-24-client-registration` → `dev` |
| `TK-25` | Feature | Project listing and detail view | `feature/tk-25-project-listing` → `dev` |
| `TK-26` | Feature | Report generation | `feature/tk-26-reports` → `dev` |
| `TK-27` | Feature | Email notification on status change | `feature/tk-27-notifications` → `dev` |
| `TK-28` | Feature | Admin dashboard | `feature/tk-28-admin-dashboard` → `dev` |
| `TK-29` | Bug | Fix duplicate validation on client form | `feature/tk-29-fix-duplicate` → `dev` |
| `TK-30` | Improvement | Improve error messages on registration | `feature/tk-30-error-messages` → `dev` |

Rules for Phase 2:

- The person in charge defines and creates these tickets.
- Each ticket must follow the standard ticket template including Branch and Merge Requirements.
- Each ticket must declare its `Depends On` if it relies on another ticket.
- Feature tickets must not be started if their Flow or Data Model ticket is not resolved.
- All Phase 2 branches target `dev`, not `develop`.
- Every feature ticket must update `backend.md` or `frontend.md` if it changes structure or behavior.
- Number tickets sequentially after TK-22.

---

### Phase 3 — Mandatory Closing Tickets

These tickets are required for every project.
Create and complete them before the first staging or production deployment.
They cover security, monitoring, cost, documentation finalization, and the go-live plan.

The closing ticket numbers start after the last project ticket.
Use `TK-LAST+1` as the starting number. Example: if the last project ticket is TK-35, closing tickets start at TK-36.

#### Group D — Security Review

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-LAST+1` | Security | Configure WAF rules for CloudFront and API Gateway | `feature/tk-xx-waf` → `dev` |
| `TK-LAST+2` | Security | Set up Secrets Manager and Parameter Store | `feature/tk-xx-secrets` → `dev` |
| `TK-LAST+3` | Security | Review and apply least privilege IAM policies | `feature/tk-xx-iam-review` → `dev` |
| `TK-LAST+4` | Documentation | Write `security.md` — roles, permissions, WAF, and secrets | `feature/tk-xx-security-docs` → `dev` |

#### Group E — Monitoring Review

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-LAST+5` | Monitoring | Create global CloudWatch dashboard for production | `feature/tk-xx-dashboard` → `dev` |
| `TK-LAST+6` | Monitoring | Verify all Lambda alarms are in place across the project | `feature/tk-xx-alarms-review` → `dev` |
| `TK-LAST+7` | Monitoring | Review structured log consistency across all Lambdas | `feature/tk-xx-logs-review` → `dev` |
| `TK-LAST+8` | Monitoring | Verify X-Ray tracing coverage for all critical flows | `feature/tk-xx-xray-review` → `dev` |
| `TK-LAST+9` | Documentation | Write `monitoring.md` — alarms, dashboards, logs, and debugging guide | `feature/tk-xx-monitoring-docs` → `dev` |

#### Group F — Cost, Documentation Finalization, and Go-Live

| Ticket | Type | Title | Branch |
|---|---|---|---|
| `TK-LAST+10` | Infrastructure | Configure AWS Budgets and billing alerts | `feature/tk-xx-budgets` → `dev` |
| `TK-LAST+11` | Infrastructure | Apply cost allocation tags to all resources | `feature/tk-xx-cost-tags` → `dev` |
| `TK-LAST+12` | Documentation | Finalize `architecture.md` — update with any changes made during development | `feature/tk-xx-architecture-final` → `dev` |
| `TK-LAST+13` | Documentation | Finalize `database.md` — update with final GSIs and access patterns | `feature/tk-xx-database-final` → `dev` |
| `TK-LAST+14` | Documentation | Finalize `backend.md` — update with all Lambda modules and routes | `feature/tk-xx-backend-final` → `dev` |
| `TK-LAST+15` | Documentation | Finalize `deployment.md` — complete with rollback steps and troubleshooting | `feature/tk-xx-deployment-final` → `dev` |
| `TK-LAST+16` | Deployment | Define and document the first production release plan | `feature/tk-xx-release-plan` → `dev` |
| `TK-LAST+17` | Deployment | Merge `dev` into `develop` for staging validation | `dev` → `develop` |
| `TK-LAST+18` | Deployment | Merge `develop` into `main` and deploy to production | `develop` → `main` |

Documents finalized in Phase 3:

| Document | Action |
|---|---|
| `architecture.md` | Final review and update — started in Group A (TK-05) |
| `database.md` | Final review and update — started in Group A (TK-06) |
| `backend.md` | Final review and update — started in Group B (TK-16), updated per feature |
| `deployment.md` | Complete with rollback and troubleshooting — started in Group B (TK-17) |
| `security.md` | Write complete — full security posture only visible at the end |
| `monitoring.md` | Write complete — all alarms and dashboards exist by now |

Rules for Phase 3:

- Do not deploy to staging or production until Group D is complete.
- Do not deploy to production until Groups E and F are complete.
- All Phase 3 feature branches target `dev`.
- TK-LAST+17 promotes `dev` to `develop` for staging validation.
- TK-LAST+18 is the only ticket that targets `main`. It requires all Phase 3 groups to be complete.
- Phase 3 tickets are the same for every project. Do not skip them.

---

### Recommended ticket types:

- Architecture
- Flow
- Data Model
- Security
- Infrastructure
- Feature
- Bug
- Improvement
- Monitoring
- Documentation
- Deployment

---

## 27. Project Settings Standard

Project-specific human-language documentation should be stored in:

```text
docs/project-settings/
```

Recommended files:

| File | Purpose |
|---|---|
| `architecture.md` | Explains how the current project works |
| `cdk.md` | Explains the CDK structure of the current project |
| `frontend.md` | Explains the frontend setup |
| `backend.md` | Explains Lambda modules and backend logic |
| `database.md` | Explains tables, indexes, and access patterns |
| `security.md` | Explains roles, permissions, WAF, and secrets |
| `monitoring.md` | Explains alarms, logs, metrics, and debugging |
| `deployment.md` | Explains deployment, rollback, and troubleshooting |

Document lifecycle:

| Document | When to start | When to finalize | Ticket |
|---|---|---|---|
| `architecture.md` | Group A — initial draft | Phase 3 Group F — final review | TK-05 → TK-LAST+12 |
| `database.md` | Group A — initial draft | Phase 3 Group F — final review | TK-06 → TK-LAST+13 |
| `cdk.md` | Group B — write complete | — | TK-15 |
| `backend.md` | Group B — initial draft | Phase 3 Group F — final review | TK-16 → TK-LAST+14 |
| `deployment.md` | Group B — initial draft | Phase 3 Group F — complete | TK-17 → TK-LAST+15 |
| `frontend.md` | Group C — write complete | — | TK-22 |
| `security.md` | Phase 3 Group D — write complete | — | TK-LAST+4 |
| `monitoring.md` | Phase 3 Group E — write complete | — | TK-LAST+9 |

Rules:

- Every document has an assigned ticket. Do not write documentation outside of a ticket.
- Documents marked "initial draft" must be updated in Phase 2 whenever a feature changes their content.
- Every Phase 2 feature ticket must update `backend.md` or `frontend.md` if it changes structure or behavior.
- Keep `config.md` reusable. Put project-specific explanations in `project-settings/`.
- Use simple human language in project settings.

---

## 8. Git Branching Strategy

Recommended branch model:

```text
main       → backup and history, no pipeline attached
dev        → triggers dev environment deployment
prod       → triggers prod environment deployment
feature/*  → local development, merged into dev
hotfix/*   → urgent fixes, merged into prod and dev
```

Full promotion flow:

```text
feature/* → dev → prod
             ↓      ↓
            dev    prod
```

Rules:

- Never push directly to `prod`.
- Feature branches merge into `dev` first.
- After validation in dev environment, `dev` merges into `prod` for production.
- `main` is used for saving progress and history — no pipeline is attached to it.
- `hotfix/*` branches are the only exception — they merge directly into `prod` and back into `dev`.
- Use pull requests for all merges into `prod`.
- Branch names should be lowercase with hyphens.
- Delete feature branches after merging into `dev`.
- Tag releases on `prod` using semantic versioning: `v1.0.0`.

Merge requirements per target branch:

| Target | Requirements |
|---|---|
| `dev` | Tasks complete, tested locally, no secrets committed |
| `prod` | Tested in dev environment, PR reviewed and approved |
| `main` | Any time — used for saving progress |

Example branch names:

```text
feature/tk-22-client-id-uniqueness
feature/tk-25-notifications
hotfix/fix-prod-crash
```

---

## 29. Final Reusable Stack Standard

Recommended default stack:

```text
Frontend:
React + Vite + TypeScript + Ant Design + Amplify

Authentication:
Amazon Cognito

API:
Amazon API Gateway REST API

Compute:
AWS Lambda with Python 3.12

Database:
Amazon DynamoDB

Hosting:
Amazon S3 + Amazon CloudFront

Infrastructure:
AWS CDK TypeScript

CI/CD:
AWS CodePipeline + CodeBuild + CodeDeploy for Lambda

Testing:
pytest + moto for Lambda, Vitest + React Testing Library for frontend

Error Handling:
Consistent response shape, standard error codes, global frontend error handling

Security:
AWS WAF + IAM least privilege + Parameter Store + Secrets Manager + KMS

Observability:
CloudWatch Logs + Metrics + Alarms + X-Ray + Lambda Powertools

Async Processing:
Amazon SQS + DLQ + EventBridge Scheduler + optional Step Functions

Cost Control:
AWS Budgets + cost allocation tags
```

---

## 30. Final Rules

- Keep this file reusable across multiple projects.
- Do not write project-specific business logic here.
- Do not store secrets here.
- Use placeholders for reusable patterns.
- Use `project-settings/` for human-language project explanations.
- Use `tickets/` for pending work and implementation tasks.
- Use CDK as the source of truth for AWS infrastructure.
- Avoid manual AWS Console configuration unless it is documented and later converted into CDK.
