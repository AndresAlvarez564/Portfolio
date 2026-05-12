#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { PipelineStack } from "../lib/pipeline-stack";
import { devConfig } from "../config/dev";

const app = new cdk.App();

// -------------------------------------------------------------------------
// AppStack — deployed directly for manual dev deployments.
// This is the main application stack (Cognito, DynamoDB, Lambda, API, etc.)
// Deploy with: npx cdk deploy portfolio-dev-AppStack --profile portfolio-dev
// -------------------------------------------------------------------------
new AppStack(app, "portfolio-dev-AppStack", {
  config: devConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// -------------------------------------------------------------------------
// PipelineStack — deployed manually once to set up CI/CD.
// Requires Parameter Store values to be set first (GitHub connection, owner, repo).
// Deploy with: npx cdk deploy PipelineStack --profile portfolio-dev
// -------------------------------------------------------------------------
new PipelineStack(app, "PipelineStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
