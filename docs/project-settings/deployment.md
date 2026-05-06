# Deployment

> Status: Initial draft — finalize in Phase 3 Group F.
> Assigned ticket: TK-17 (initial) → TK-LAST+15 (final)

## Pipeline Overview

<!-- Describe the CodePipeline flow from GitHub to production. -->

## Manual Deploy to Dev

```bash
cd infra
npm ci && npm run build
npx cdk deploy --all --profile <project-name>-dev
```

## Rollback Steps

<!-- Document how to roll back a bad deployment. -->
<!-- To be completed in Phase 3. -->

## Troubleshooting

<!-- Common deployment issues and how to fix them. -->
<!-- To be completed in Phase 3. -->
