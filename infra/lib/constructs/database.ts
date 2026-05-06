import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface DatabaseConstructProps {
  config: EnvironmentConfig;
}

export class DatabaseConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { config } = props;

    this.table = new dynamodb.Table(this, "MainTable", {
      tableName: `${config.projectName}-${config.stage}-main`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.enablePitr,
      removalPolicy: config.removalPolicy === "destroy"
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });
  }
}
