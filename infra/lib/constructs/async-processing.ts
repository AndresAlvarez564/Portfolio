import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface AsyncProcessingConstructProps {
  config: EnvironmentConfig;
}

export class AsyncProcessingConstruct extends Construct {
  public readonly contactQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: AsyncProcessingConstructProps) {
    super(scope, id);

    const { config } = props;

    const contactDlq = new sqs.Queue(this, "ContactDlq", {
      queueName: `${config.projectName}-${config.stage}-contact-dlq`,
      retentionPeriod: Duration.days(14),
    });

    this.contactQueue = new sqs.Queue(this, "ContactQueue", {
      queueName: `${config.projectName}-${config.stage}-contact-queue`,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: contactDlq,
      },
      retentionPeriod: Duration.days(4),
      visibilityTimeout: Duration.seconds(config.lambdaTimeoutSeconds * 2),
    });

    // TODO: add EventBridge Scheduler rules
    // TODO: add Step Functions state machines
  }
}
