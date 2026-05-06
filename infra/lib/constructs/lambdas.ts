import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface LambdasConstructProps {
  config: EnvironmentConfig;
  table: dynamodb.Table;
}

export class LambdasConstruct extends Construct {
  public readonly functions: Record<string, lambda.Function> = {};

  constructor(scope: Construct, id: string, props: LambdasConstructProps) {
    super(scope, id);

    const { config, table } = props;

    // Example Lambda — replace with real domains
    const exampleFn = new lambda.Function(this, "ExampleFunction", {
      functionName: `${config.projectName}-${config.stage}-example`,
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset("../lambdas/example"),
      memorySize: config.lambdaMemory,
      timeout: Duration.seconds(config.lambdaTimeoutSeconds),
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        STAGE: config.stage,
        TABLE_NAME: table.tableName,
        LOG_LEVEL: config.stage === "prod" ? "WARNING" : "DEBUG",
        POWERTOOLS_SERVICE_NAME: `${config.projectName}-example`,
      },
    });

    table.grantReadWriteData(exampleFn);
    this.functions["example"] = exampleFn;
  }
}
