import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface PipelineStackProps extends cdk.StackProps {
  // "dev" watches the dev branch and deploys portfolio-dev-AppStack
  // "prod" watches the prod branch and deploys portfolio-prod-AppStack
  stage: "dev" | "prod";
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const stackName = `portfolio-${stage}-AppStack`;
    const branch = stage; // branch name matches stage name: dev → dev, prod → prod

    // -------------------------------------------------------------------------
    // Pipeline artifact bucket — one per stage
    // -------------------------------------------------------------------------
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      bucketName: `portfolio-${stage}-pipeline-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
    });

    // -------------------------------------------------------------------------
    // CodeBuild project — one per stage, uses the same buildspec.yml
    // The STAGE env var tells buildspec which AppStack to deploy
    // -------------------------------------------------------------------------
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: `portfolio-${stage}-build`,
      description: `Builds and deploys portfolio-${stage}-AppStack`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          CDK_DEFAULT_REGION: { value: this.region },
          CDK_DEFAULT_ACCOUNT: { value: this.account },
          DEPLOY_STAGE: { value: stage },
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
    // GitHub source connection — shared ARN, different branch per stage
    // -------------------------------------------------------------------------
    const githubConnectionArn = cdk.aws_ssm.StringParameter.valueForStringParameter(
      this,
      "/portfolio/pipeline/github-connection-arn",
    );

    const sourceOutput = new codepipeline.Artifact("SourceOutput");
    const buildOutput  = new codepipeline.Artifact("BuildOutput");

    // -------------------------------------------------------------------------
    // CodePipeline — one per stage
    // dev pipeline:  push to dev  → deploy portfolio-dev-AppStack
    // prod pipeline: push to prod → deploy portfolio-prod-AppStack
    // -------------------------------------------------------------------------
    new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: `portfolio-${stage}-pipeline`,
      artifactBucket,
      pipelineType: codepipeline.PipelineType.V2,
      stages: [
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
              branch,
              connectionArn: githubConnectionArn,
              output: sourceOutput,
              triggerOnPush: true,
            }),
          ],
        },
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
      value: `portfolio-${stage}-pipeline`,
      description: `CodePipeline name for ${stage}`,
    });

    new cdk.CfnOutput(this, "TargetStack", {
      value: stackName,
      description: `AppStack deployed by this pipeline`,
    });
  }
}
