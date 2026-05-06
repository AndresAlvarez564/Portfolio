import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface AsyncProcessingConstructProps {
  config: EnvironmentConfig;
}

export class AsyncProcessingConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AsyncProcessingConstructProps) {
    super(scope, id);

    // TODO: add SQS queues and DLQs when async processing is needed
    // TODO: add EventBridge Scheduler rules
    // TODO: add Step Functions state machines
  }
}
