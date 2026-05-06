import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface ApiConstructProps {
  config: EnvironmentConfig;
  lambdas: Record<string, lambda.Function>;
  userPool: cognito.UserPool;
}

export class ApiConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { config, lambdas, userPool } = props;

    this.restApi = new apigateway.RestApi(this, "RestApi", {
      restApiName: `${config.projectName}-${config.stage}-api`,
      deployOptions: { stageName: config.stage, tracingEnabled: true, metricsEnabled: true },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "Authorizer", {
      cognitoUserPools: [userPool],
    });

    // Example route — replace with real routes
    const exampleResource = this.restApi.root.addResource("example");
    exampleResource.addMethod("GET", new apigateway.LambdaIntegration(lambdas["example"]), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
