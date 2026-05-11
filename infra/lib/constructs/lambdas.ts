import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface LambdasConstructProps {
  config: EnvironmentConfig;
  table: dynamodb.Table;
}

// Business domains — each maps to a Lambda function and a lambdas/<domain>/ folder
const DOMAINS = [
  "profile",
  "projects",
  "experience",
  "skills",
  "certifications",
  "media",
  "contact",
] as const;

type Domain = typeof DOMAINS[number];

export class LambdasConstruct extends Construct {
  public readonly functions: Record<string, lambda.Function> = {};

  constructor(scope: Construct, id: string, props: LambdasConstructProps) {
    super(scope, id);

    const { config, table } = props;

    const logRetention = config.stage === "prod"
      ? logs.RetentionDays.ONE_YEAR
      : config.stage === "staging"
        ? logs.RetentionDays.THREE_MONTHS
        : logs.RetentionDays.ONE_MONTH;

    for (const domain of DOMAINS) {
      const fn = this.createDomainFunction(domain, config, table, logRetention);
      this.functions[domain] = fn;
    }
  }

  private createDomainFunction(
    domain: Domain,
    config: EnvironmentConfig,
    table: dynamodb.Table,
    logRetention: logs.RetentionDays,
  ): lambda.Function {
    const fn = new lambda.Function(this, `${capitalize(domain)}Function`, {
      functionName: `${config.projectName}-${config.stage}-${domain}`,
      description: `Portfolio CRM — ${domain} domain handler`,
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset(`../lambdas/${domain}`),
      memorySize: config.lambdaMemory,
      timeout: Duration.seconds(config.lambdaTimeoutSeconds),
      tracing: lambda.Tracing.ACTIVE,
      logRetention,
      environment: {
        STAGE: config.stage,
        TABLE_NAME: table.tableName,
        LOG_LEVEL: config.stage === "prod" ? "WARNING" : "DEBUG",
        POWERTOOLS_SERVICE_NAME: `${config.projectName}-${domain}`,
      },
    });

    // Grant read/write access to the DynamoDB table
    table.grantReadWriteData(fn);

    return fn;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
