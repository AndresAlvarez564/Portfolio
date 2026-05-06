import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { EnvironmentConfig } from "../../config/dev";

interface MonitoringConstructProps {
  config: EnvironmentConfig;
  lambdas: Record<string, lambda.Function>;
  api: apigateway.RestApi;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { config, lambdas } = props;

    // Create error and duration alarms for each Lambda
    Object.entries(lambdas).forEach(([name, fn]) => {
      new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
        alarmName: `${config.projectName}-${config.stage}-${name}-errors-alarm`,
        metric: fn.metricErrors({ period: Duration.minutes(5) }),
        threshold: 1,
        evaluationPeriods: 1,
      });

      new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
        alarmName: `${config.projectName}-${config.stage}-${name}-duration-alarm`,
        metric: fn.metricDuration({ period: Duration.minutes(5) }),
        threshold: config.lambdaTimeoutSeconds * 1000 * 0.8, // 80% of timeout
        evaluationPeriods: 3,
      });
    });
  }
}
