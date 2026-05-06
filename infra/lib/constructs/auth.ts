import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface AuthConstructProps {
  config: EnvironmentConfig;
}

export class AuthConstruct extends Construct {
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    const { config } = props;

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${config.projectName}-${config.stage}-user-pool`,
      selfSignUpEnabled: false,
      removalPolicy: config.removalPolicy === "destroy"
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });
  }
}
