import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface LambdasConstructProps {
  config: EnvironmentConfig;
  table: dynamodb.Table;
  mediaBucket: s3.Bucket;
  mediaUrl?: string;
  contactQueue?: sqs.Queue;
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
  // Expose aliases — API Gateway and other consumers use the `live` alias,
  // never $LATEST directly. Aliases are IFunction-compatible.
  public readonly aliases: Record<string, lambda.Alias> = {};

  // Also expose raw functions for monitoring (metrics are on the function, not the alias)
  public readonly functions: Record<string, lambda.Function> = {};

  constructor(scope: Construct, id: string, props: LambdasConstructProps) {
    super(scope, id);

    const { config, table, mediaBucket, mediaUrl, contactQueue } = props;

    const logRetention = config.stage === "prod"
      ? logs.RetentionDays.ONE_YEAR
      : config.stage === "staging"
        ? logs.RetentionDays.THREE_MONTHS
        : logs.RetentionDays.ONE_MONTH;

    // Pick CodeDeploy deployment strategy based on environment
    const deploymentConfig = this.deploymentConfig(config.stage);

    for (const domain of DOMAINS) {
      const { fn, alias } = this.createDomainFunction(
        domain, config, table, mediaBucket, mediaUrl, contactQueue, logRetention, deploymentConfig,
      );
      this.functions[domain] = fn;
      this.aliases[domain] = alias;
    }
  }

  private createDomainFunction(
    domain: Domain,
    config: EnvironmentConfig,
    table: dynamodb.Table,
    mediaBucket: s3.Bucket,
    mediaUrl: string | undefined,
    contactQueue: sqs.Queue | undefined,
    logRetention: logs.RetentionDays,
    deploymentConfig: codedeploy.ILambdaDeploymentConfig,
  ): { fn: lambda.Function; alias: lambda.Alias } {
    // --- Base environment variables ---
    const environment: Record<string, string> = {
      STAGE: config.stage,
      TABLE_NAME: table.tableName,
      LOG_LEVEL: config.stage === "prod" ? "WARNING" : "DEBUG",
      POWERTOOLS_SERVICE_NAME: `${config.projectName}-${domain}`,
    };

    if (domain === "media") {
      environment["MEDIA_BUCKET_NAME"] = mediaBucket.bucketName;
      if (mediaUrl) {
        environment["CLOUDFRONT_MEDIA_URL"] = mediaUrl;
      }
    }
    if (domain === "contact" && contactQueue) {
      environment["CONTACT_QUEUE_URL"] = contactQueue.queueUrl;
    }

    // --- Lambda function ---
    const fn = new lambda.Function(this, `${cap(domain)}Function`, {
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
      environment,
    });

    table.grantReadWriteData(fn);
    if (domain === "media") {
      mediaBucket.grantReadWrite(fn);
    }
    if (domain === "contact" && contactQueue) {
      contactQueue.grantSendMessages(fn);
    }

    // --- Lambda version (immutable snapshot used by CodeDeploy) ---
    const version = fn.currentVersion;

    // --- live alias — API Gateway always calls this, never $LATEST ---
    const alias = new lambda.Alias(this, `${cap(domain)}LiveAlias`, {
      aliasName: "live",
      version,
    });

    // --- CloudWatch error alarm — used by CodeDeploy for automatic rollback ---
    const errorAlarm = new cloudwatch.Alarm(this, `${cap(domain)}ErrorAlarm`, {
      alarmName: `${config.projectName}-${config.stage}-${domain}-errors-alarm`,
      metric: fn.metricErrors({ period: Duration.minutes(1) }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // --- CodeDeploy deployment group ---
    // Shifts traffic from the old alias version to the new one.
    // If the error alarm fires during the shift, CodeDeploy rolls back automatically.
    new codedeploy.LambdaDeploymentGroup(this, `${cap(domain)}DeploymentGroup`, {
      alias,
      deploymentConfig,
      alarms: [errorAlarm],
    });

    return { fn, alias };
  }

  private deploymentConfig(stage: string): codedeploy.ILambdaDeploymentConfig {
    switch (stage) {
      case "prod":
        // Shift 10% of traffic, wait 5 minutes, then shift the rest.
        // Rolls back automatically if the error alarm fires.
        return codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES;
      case "staging":
        // Shift 10% every minute until 100%.
        return codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE;
      default:
        // Dev: shift all traffic at once — fast feedback, no real users.
        return codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE;
    }
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
