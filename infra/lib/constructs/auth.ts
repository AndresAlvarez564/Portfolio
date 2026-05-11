import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface AuthConstructProps {
  config: EnvironmentConfig;
}

export class AuthConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    const { config } = props;

    // --- User Pool ---
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${config.projectName}-${config.stage}-user-pool`,
      selfSignUpEnabled: false,

      // Email-based sign-in
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: { email: true },

      // Password policy per security.md
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },

      // Account recovery via email
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Standard attributes
      standardAttributes: {
        email: { required: true, mutable: true },
      },

      // MFA: optional in dev, recommended in prod (OFF keeps it optional for the user)
      mfa: config.stage === "prod"
        ? cognito.Mfa.OPTIONAL
        : cognito.Mfa.OFF,
      mfaSecondFactor: config.stage === "prod"
        ? { sms: false, otp: true }
        : undefined,

      removalPolicy: config.removalPolicy === "destroy"
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });

    // --- App Client ---
    this.userPoolClient = this.userPool.addClient("AppClient", {
      userPoolClientName: `${config.projectName}-${config.stage}-client`,

      // Auth flows per security.md
      authFlows: {
        userPassword: true,
        userSrp: true,
      },

      // No hosted UI — custom React login page
      generateSecret: false,

      // Token validity per security.md: ID token 1h, refresh token 30 days
      idTokenValidity: cdk.Duration.hours(1),
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      // Prevent user existence errors from leaking
      preventUserExistenceErrors: true,
    });

    // --- Admin Group ---
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admin",
      description: "Full access to admin panel and all protected API endpoints",
    });

    // --- CloudFormation Outputs ---
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: `${config.projectName}-${config.stage}-user-pool-id`,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito App Client ID",
      exportName: `${config.projectName}-${config.stage}-user-pool-client-id`,
    });
  }
}
