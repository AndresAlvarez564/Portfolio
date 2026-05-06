import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppStack } from "./app-stack";
import { EnvironmentConfig } from "../config/dev";

interface AppStageProps extends cdk.StageProps {
  config: EnvironmentConfig;
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);

    new AppStack(this, "AppStack", {
      config: props.config,
      env: props.env,
    });
  }
}
