import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface FrontendHostingConstructProps {
  config: EnvironmentConfig;
}

export class FrontendHostingConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FrontendHostingConstructProps) {
    super(scope, id);

    const { config } = props;

    const bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${config.projectName}-${config.stage}-frontend-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: config.removalPolicy === "destroy"
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: config.removalPolicy === "destroy",
    });

    const oac = new cloudfront.S3OriginAccessControl(this, "OAC");

    new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, { originAccessControl: oac }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/index.html" },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html" },
      ],
    });
  }
}
