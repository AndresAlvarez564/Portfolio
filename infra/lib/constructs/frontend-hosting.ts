import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface FrontendHostingConstructProps {
  config: EnvironmentConfig;
}

export class FrontendHostingConstruct extends Construct {
  public readonly frontendBucket: s3.Bucket;
  public readonly mediaBucket: s3.Bucket;
  public readonly frontendDistribution: cloudfront.Distribution;
  public readonly mediaDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendHostingConstructProps) {
    super(scope, id);

    const { config } = props;

    const removalPolicy = config.removalPolicy === "destroy"
      ? cdk.RemovalPolicy.DESTROY
      : cdk.RemovalPolicy.RETAIN;

    // -------------------------------------------------------------------------
    // Frontend S3 Bucket — private, served exclusively via CloudFront
    // -------------------------------------------------------------------------
    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${config.projectName}-${config.stage}-frontend-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy,
      autoDeleteObjects: config.removalPolicy === "destroy",
    });

    // -------------------------------------------------------------------------
    // Media S3 Bucket — private, stores screenshots, CV, badges, thumbnails
    // -------------------------------------------------------------------------
    this.mediaBucket = new s3.Bucket(this, "MediaBucket", {
      bucketName: `${config.projectName}-${config.stage}-media-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      cors: [
        {
          // Allow pre-signed URL uploads directly from the browser
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      removalPolicy,
      autoDeleteObjects: config.removalPolicy === "destroy",
    });

    // -------------------------------------------------------------------------
    // Frontend CloudFront Distribution
    // -------------------------------------------------------------------------
    const frontendOac = new cloudfront.S3OriginAccessControl(this, "FrontendOAC", {
      description: `OAC for ${config.projectName}-${config.stage} frontend bucket`,
    });

    this.frontendDistribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      comment: `${config.projectName}-${config.stage}-distribution`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.frontendBucket, {
          originAccessControl: frontendOac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: "index.html",
      // React Router fallback — 403/404 from S3 → serve index.html
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
      // HTTP → HTTPS redirect is handled by viewerProtocolPolicy above
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // -------------------------------------------------------------------------
    // Media CloudFront Distribution
    // -------------------------------------------------------------------------
    const mediaOac = new cloudfront.S3OriginAccessControl(this, "MediaOAC", {
      description: `OAC for ${config.projectName}-${config.stage} media bucket`,
    });

    this.mediaDistribution = new cloudfront.Distribution(this, "MediaDistribution", {
      comment: `${config.projectName}-${config.stage}-media-distribution`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.mediaBucket, {
          originAccessControl: mediaOac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // -------------------------------------------------------------------------
    // CloudFormation Outputs
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: this.frontendBucket.bucketName,
      description: "Frontend S3 bucket name",
      exportName: `${config.projectName}-${config.stage}-frontend-bucket`,
    });

    new cdk.CfnOutput(this, "MediaBucketName", {
      value: this.mediaBucket.bucketName,
      description: "Media S3 bucket name",
      exportName: `${config.projectName}-${config.stage}-media-bucket`,
    });

    new cdk.CfnOutput(this, "FrontendUrl", {
      value: `https://${this.frontendDistribution.distributionDomainName}`,
      description: "CloudFront URL for the frontend",
      exportName: `${config.projectName}-${config.stage}-frontend-url`,
    });

    new cdk.CfnOutput(this, "FrontendDistributionId", {
      value: this.frontendDistribution.distributionId,
      description: "CloudFront distribution ID for the frontend (used for cache invalidation)",
      exportName: `${config.projectName}-${config.stage}-frontend-distribution-id`,
    });

    new cdk.CfnOutput(this, "MediaUrl", {
      value: `https://${this.mediaDistribution.distributionDomainName}`,
      description: "CloudFront URL for media files",
      exportName: `${config.projectName}-${config.stage}-media-url`,
    });

    new cdk.CfnOutput(this, "MediaDistributionId", {
      value: this.mediaDistribution.distributionId,
      description: "CloudFront distribution ID for media",
      exportName: `${config.projectName}-${config.stage}-media-distribution-id`,
    });
  }
}
