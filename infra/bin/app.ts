#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { PipelineStack } from "../lib/pipeline-stack";
import { devConfig } from "../config/dev";
import { prodConfig } from "../config/prod";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region:  process.env.CDK_DEFAULT_REGION,
};

// -------------------------------------------------------------------------
// Dev AppStack — deployed by the dev pipeline on every push to dev branch.
// Also used for manual deploys during development.
// Deploy manually: npx cdk deploy portfolio-dev-AppStack
// -------------------------------------------------------------------------
new AppStack(app, "portfolio-dev-AppStack", {
  config: devConfig,
  env,
});

// -------------------------------------------------------------------------
// Prod AppStack — deployed by the prod pipeline on every push to prod branch.
// Deploy manually: npx cdk deploy portfolio-prod-AppStack
// -------------------------------------------------------------------------
new AppStack(app, "portfolio-prod-AppStack", {
  config: prodConfig,
  env,
});

// -------------------------------------------------------------------------
// Dev Pipeline — watches the dev branch, deploys portfolio-dev-AppStack.
// Deploy once: npx cdk deploy portfolio-dev-PipelineStack
// Requires Parameter Store values:
//   /portfolio/pipeline/github-connection-arn
//   /portfolio/pipeline/github-owner
//   /portfolio/pipeline/github-repo
// -------------------------------------------------------------------------
new PipelineStack(app, "portfolio-dev-PipelineStack", {
  stage: "dev",
  env,
});

// -------------------------------------------------------------------------
// Prod Pipeline — watches the prod branch, deploys portfolio-prod-AppStack.
// Deploy once: npx cdk deploy portfolio-prod-PipelineStack
// -------------------------------------------------------------------------
new PipelineStack(app, "portfolio-prod-PipelineStack", {
  stage: "prod",
  env,
});
