import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface AsyncProcessingConstructProps {
  config: EnvironmentConfig;
}

export class AsyncProcessingConstruct extends Construct {
  public readonly contactQueue: sqs.Queue;
  public readonly contactDlq: sqs.Queue;
  public readonly emailWorker: lambda.Function;

  constructor(scope: Construct, id: string, props: AsyncProcessingConstructProps) {
    super(scope, id);

    const { config } = props;

    this.contactDlq = new sqs.Queue(this, "ContactDlq", {
      queueName: `${config.projectName}-${config.stage}-contact-dlq`,
      retentionPeriod: Duration.days(14),
    });

    this.contactQueue = new sqs.Queue(this, "ContactQueue", {
      queueName: `${config.projectName}-${config.stage}-contact-queue`,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.contactDlq,
      },
      retentionPeriod: Duration.days(4),
      visibilityTimeout: Duration.seconds(30),
    });

    new ses.EmailIdentity(this, "EmailWorkerSenderIdentity", {
      identity: ses.Identity.email(config.sesFromEmail),
    });

    const logRetention = config.stage === "prod"
      ? logs.RetentionDays.ONE_YEAR
      : config.stage === "staging"
        ? logs.RetentionDays.THREE_MONTHS
        : logs.RetentionDays.ONE_MONTH;

    this.emailWorker = new lambda.Function(this, "EmailWorkerFunction", {
      functionName: `${config.projectName}-${config.stage}-email-worker`,
      description: "Portfolio CRM - contact form email worker",
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset("../lambdas/email_worker"),
      memorySize: config.lambdaMemory,
      timeout: Duration.seconds(config.lambdaTimeoutSeconds),
      tracing: lambda.Tracing.ACTIVE,
      logRetention,
      environment: {
        STAGE: config.stage,
        LOG_LEVEL: config.stage === "prod" ? "WARNING" : "DEBUG",
        POWERTOOLS_SERVICE_NAME: `${config.projectName}-email-worker`,
        SES_FROM_EMAIL: config.sesFromEmail,
        SES_TO_EMAIL: config.sesToEmail,
      },
    });

    this.emailWorker.addEventSource(new lambdaEventSources.SqsEventSource(this.contactQueue, {
      batchSize: 10,
      reportBatchItemFailures: true,
    }));
    this.emailWorker.addToRolePolicy(new iam.PolicyStatement({
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    }));

    new cloudwatch.Alarm(this, "EmailWorkerErrorAlarm", {
      alarmName: `${config.projectName}-${config.stage}-email-worker-errors-alarm`,
      metric: this.emailWorker.metricErrors({ period: Duration.minutes(1) }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, "EmailWorkerDurationAlarm", {
      alarmName: `${config.projectName}-${config.stage}-email-worker-duration-alarm`,
      metric: this.emailWorker.metricDuration({ period: Duration.minutes(5) }),
      threshold: config.lambdaTimeoutSeconds * 1000 * 0.8,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, "ContactDlqDepthAlarm", {
      alarmName: `${config.projectName}-${config.stage}-contact-dlq-depth-alarm`,
      metric: this.contactDlq.metricApproximateNumberOfMessagesVisible({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // TODO: add EventBridge Scheduler rules
    // TODO: add Step Functions state machines
  }
}
