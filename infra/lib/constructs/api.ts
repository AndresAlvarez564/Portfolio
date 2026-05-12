import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface ApiConstructProps {
  config: EnvironmentConfig;
  // Aliases are IFunction-compatible — API Gateway calls the `live` alias, never $LATEST
  lambdas: Record<string, lambda.IFunction>;
  userPool: cognito.UserPool;
}

export class ApiConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { config, lambdas, userPool } = props;

    // --- CloudWatch Log Group for API Gateway access logs ---
    const accessLogGroup = new logs.LogGroup(this, "AccessLogs", {
      logGroupName: `/aws/apigateway/${config.projectName}-${config.stage}-api`,
      retention: config.stage === "prod"
        ? logs.RetentionDays.ONE_YEAR
        : config.stage === "staging"
          ? logs.RetentionDays.THREE_MONTHS
          : logs.RetentionDays.ONE_MONTH,
      removalPolicy: config.removalPolicy === "destroy"
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });

    // --- REST API ---
    this.restApi = new apigateway.RestApi(this, "RestApi", {
      restApiName: `${config.projectName}-${config.stage}-api`,
      description: `Portfolio CRM API — ${config.stage}`,
      deployOptions: {
        stageName: config.stage,
        tracingEnabled: true,
        metricsEnabled: true,
        dataTraceEnabled: config.stage !== "prod", // avoid logging request bodies in prod
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      // CORS — tightened per environment in a real deployment;
      // ALL_ORIGINS is acceptable for dev/staging, prod should restrict to the real domain.
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });

    // --- Cognito Authorizer ---
    // Used on all protected (admin) endpoints.
    // API Gateway validates the ID token signature and expiration.
    // Lambda still checks cognito:groups membership for admin enforcement.
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "CognitoAuthorizer", {
      cognitoUserPools: [userPool],
      authorizerName: `${config.projectName}-${config.stage}-authorizer`,
      identitySource: "method.request.header.Authorization",
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // Shorthand for attaching the Cognito authorizer to a method
    const withAuth: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Helper: build a LambdaIntegration when the function exists, otherwise a mock (safety fallback)
    const mockIntegration = new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: "501" }],
      requestTemplates: { "application/json": '{"statusCode": 501}' },
    });
    const methodOptions = (auth?: apigateway.MethodOptions): apigateway.MethodOptions => ({
      ...auth,
    });
    const integration = (key: string): apigateway.Integration =>
      lambdas[key]
        ? new apigateway.LambdaIntegration(lambdas[key])
        : mockIntegration;

    // -------------------------------------------------------------------------
    // PUBLIC ROUTES — no Cognito authorizer
    // -------------------------------------------------------------------------

    // GET /profile
    const profileResource = this.restApi.root.addResource("profile");
    profileResource.addMethod("GET", integration("profile"), methodOptions());

    // PUT /profile  (admin)
    profileResource.addMethod("PUT", integration("profile"), methodOptions(withAuth));

    // GET /projects
    // POST /projects  (admin)
    // GET /projects/admin  (admin) — must be defined before {slug} to avoid conflict
    const projectsResource = this.restApi.root.addResource("projects");
    projectsResource.addMethod("GET", integration("projects"), methodOptions());
    projectsResource.addMethod("POST", integration("projects"), methodOptions(withAuth));

    const projectsAdminResource = projectsResource.addResource("admin");
    projectsAdminResource.addMethod("GET", integration("projects"), methodOptions(withAuth));

    // GET /projects/{slug}          (public — by slug)
    // GET /projects/{id}/admin      (admin — by ID, includes drafts)
    // PUT /projects/{id}            (admin)
    // DELETE /projects/{id}         (admin)
    // PATCH /projects/{id}          (admin — status / featured)
    const projectByIdResource = projectsResource.addResource("{slug}");
    projectByIdResource.addMethod("GET", integration("projects"), methodOptions());
    projectByIdResource.addMethod("PUT", integration("projects"), methodOptions(withAuth));
    projectByIdResource.addMethod("DELETE", integration("projects"), methodOptions(withAuth));
    projectByIdResource.addMethod("PATCH", integration("projects"), methodOptions(withAuth));

    const projectAdminByIdResource = projectByIdResource.addResource("admin");
    projectAdminByIdResource.addMethod("GET", integration("projects"), methodOptions(withAuth));

    // GET /projects/{id}/case-study   (admin)
    // PUT /projects/{id}/case-study   (admin)
    const caseStudyResource = projectByIdResource.addResource("case-study");
    caseStudyResource.addMethod("GET", integration("projects"), methodOptions(withAuth));
    caseStudyResource.addMethod("PUT", integration("projects"), methodOptions(withAuth));

    // GET /experience
    // POST /experience  (admin)
    const experienceResource = this.restApi.root.addResource("experience");
    experienceResource.addMethod("GET", integration("experience"), methodOptions());
    experienceResource.addMethod("POST", integration("experience"), methodOptions(withAuth));

    // PATCH /experience/reorder  (admin) — must be before {id}
    const experienceReorderResource = experienceResource.addResource("reorder");
    experienceReorderResource.addMethod("PATCH", integration("experience"), methodOptions(withAuth));

    // PUT /experience/{id}     (admin)
    // DELETE /experience/{id}  (admin)
    const experienceByIdResource = experienceResource.addResource("{id}");
    experienceByIdResource.addMethod("PUT", integration("experience"), methodOptions(withAuth));
    experienceByIdResource.addMethod("DELETE", integration("experience"), methodOptions(withAuth));

    // GET /skills
    // POST /skills  (admin)
    const skillsResource = this.restApi.root.addResource("skills");
    skillsResource.addMethod("GET", integration("skills"), methodOptions());
    skillsResource.addMethod("POST", integration("skills"), methodOptions(withAuth));

    // PUT /skills/{id}     (admin)
    // DELETE /skills/{id}  (admin)
    const skillByIdResource = skillsResource.addResource("{id}");
    skillByIdResource.addMethod("PUT", integration("skills"), methodOptions(withAuth));
    skillByIdResource.addMethod("DELETE", integration("skills"), methodOptions(withAuth));

    // GET /certifications
    // POST /certifications  (admin)
    const certificationsResource = this.restApi.root.addResource("certifications");
    certificationsResource.addMethod("GET", integration("certifications"), methodOptions());
    certificationsResource.addMethod("POST", integration("certifications"), methodOptions(withAuth));

    // PUT /certifications/{id}     (admin)
    // DELETE /certifications/{id}  (admin)
    const certByIdResource = certificationsResource.addResource("{id}");
    certByIdResource.addMethod("PUT", integration("certifications"), methodOptions(withAuth));
    certByIdResource.addMethod("DELETE", integration("certifications"), methodOptions(withAuth));

    // POST /media/upload    (admin)
    // POST /media/confirm   (admin)
    // GET  /media           (admin)
    const mediaResource = this.restApi.root.addResource("media");
    mediaResource.addMethod("GET", integration("media"), methodOptions(withAuth));

    const mediaUploadResource = mediaResource.addResource("upload");
    mediaUploadResource.addMethod("POST", integration("media"), methodOptions(withAuth));

    const mediaConfirmResource = mediaResource.addResource("confirm");
    mediaConfirmResource.addMethod("POST", integration("media"), methodOptions(withAuth));

    // DELETE /media/{id}  (admin)
    const mediaByIdResource = mediaResource.addResource("{id}");
    mediaByIdResource.addMethod("DELETE", integration("media"), methodOptions(withAuth));

    // POST /contact          (public)
    // GET  /contact          (admin)
    const contactResource = this.restApi.root.addResource("contact");
    contactResource.addMethod("POST", integration("contact"), methodOptions());
    contactResource.addMethod("GET", integration("contact"), methodOptions(withAuth));

    // GET   /contact/{id}    (admin)
    // PATCH /contact/{id}    (admin)
    const contactByIdResource = contactResource.addResource("{id}");
    contactByIdResource.addMethod("GET", integration("contact"), methodOptions(withAuth));
    contactByIdResource.addMethod("PATCH", integration("contact"), methodOptions(withAuth));

    // -------------------------------------------------------------------------
    // CloudFormation Outputs
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.restApi.url,
      description: "API Gateway base URL",
      exportName: `${config.projectName}-${config.stage}-api-url`,
    });

    new cdk.CfnOutput(this, "ApiId", {
      value: this.restApi.restApiId,
      description: "API Gateway REST API ID",
      exportName: `${config.projectName}-${config.stage}-api-id`,
    });
  }
}
