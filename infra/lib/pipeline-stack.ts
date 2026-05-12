import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -------------------------------------------------------------------------
    // Pipeline artifact bucket
    // -------------------------------------------------------------------------
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      bucketName: `portfolio-pipeline-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Keep artifacts for 30 days
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
    });

    // -------------------------------------------------------------------------
    // CodeBuild project
    // -------------------------------------------------------------------------
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: "portfolio-build",
      description: "Builds and deploys the Portfolio CRM application",
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          // These are non-sensitive — real secrets come from Parameter Store at build time
          CDK_DEFAULT_REGION: { value: this.region },
          CDK_DEFAULT_ACCOUNT: { value: this.account },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.CUSTOM),
    });

    // Grant CodeBuild permissions to deploy CDK stacks and manage resources
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      sid: "CdkDeployPermissions",
      effect: iam.Effect.ALLOW,
      actions: [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "cognito-idp:*",
        "dynamodb:*",
        "cloudfront:*",
        "iam:*",
        "logs:*",
        "xray:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "codedeploy:*",
      ],
      resources: ["*"],
    }));

    // -------------------------------------------------------------------------
    // Pipeline artifacts
    // -------------------------------------------------------------------------
    const sourceOutput = new codepipeline.Artifact("SourceOutput");
    const buildOutput = new codepipeline.Artifact("BuildOutput");

    // -------------------------------------------------------------------------
    // GitHub source connection
    // NOTE: The GitHub connection ARN must be created manually in the AWS Console
    // under Developer Tools → Connections, then set as a Parameter Store value.
    // -------------------------------------------------------------------------
    const githubConnectionArn = cdk.aws_ssm.StringParameter.valueForStringParameter(
      this,
      "/portfolio/pipeline/github-connection-arn",
    );

    // -------------------------------------------------------------------------
    // CodePipeline
    // -------------------------------------------------------------------------
    new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "portfolio-pipeline",
      artifactBucket,
      pipelineType: codepipeline.PipelineType.V2,
      stages: [
        // Stage 1: Source — pull from GitHub
        {
          stageName: "Source",
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: "GitHub_Source",
              owner: cdk.aws_ssm.StringParameter.valueForStringParameter(
                this,
                "/portfolio/pipeline/github-owner",
              ),
              repo: cdk.aws_ssm.StringParameter.valueForStringParameter(
                this,
                "/portfolio/pipeline/github-repo",
              ),
              branch: "dev",
              connectionArn: githubConnectionArn,
              output: sourceOutput,
              triggerOnPush: true,
            }),
          ],
        },
        // Stage 2: Build — install, test, synth, deploy
        {
          stageName: "Build",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "Build_And_Deploy",
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ],
    });

    // -------------------------------------------------------------------------
    // CloudFormation Outputs
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, "PipelineName", {
      value: "portfolio-pipeline",
      description: "CodePipeline name",
    });

    new cdk.CfnOutput(this, "BuildProjectName", {
      value: buildProject.projectName,
      description: "CodeBuild project name",
    });
  }
}
