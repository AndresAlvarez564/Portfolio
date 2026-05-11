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

    const removalPolicy = config.removalPolicy === "destroy"
      ? cdk.RemovalPolicy.DESTROY
      : cdk.RemovalPolicy.RETAIN;

    // --- Main Table ---
    this.table = new dynamodb.Table(this, "MainTable", {
      tableName: `${config.projectName}-${config.stage}-main`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.enablePitr,
      removalPolicy,
    });

    // --- GSI-1: gsi1pk / gsi1sk ---
    // General-purpose GSI used by all entities.
    // Supports: list projects by status, experience by order, skills by visibility,
    //           certifications by issue date, media by type, contact messages by status.
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- GSI-2: gsi2pk / gsi2sk ---
    // Used for featured project ordering and media-by-related-entity lookups.
    // Supports: featured projects sorted by featuredOrder,
    //           media files belonging to a specific project or certification.
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- GSI-3: gsi3pk / gsi3sk ---
    // Used for slug-based project lookups.
    // Supports: look up a project by its URL slug (gsi3pk = SLUG#<slug>, gsi3sk = PROJECT).
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: { name: "gsi3pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi3sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- CloudFormation Outputs ---
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB main table name",
      exportName: `${config.projectName}-${config.stage}-table-name`,
    });

    new cdk.CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      description: "DynamoDB main table ARN",
      exportName: `${config.projectName}-${config.stage}-table-arn`,
    });
  }
}
