import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthConstruct } from "./constructs/auth";
import { DatabaseConstruct } from "./constructs/database";
import { LambdasConstruct } from "./constructs/lambdas";
import { ApiConstruct } from "./constructs/api";
import { FrontendHostingConstruct } from "./constructs/frontend-hosting";
import { MonitoringConstruct } from "./constructs/monitoring";
import { SecurityConstruct } from "./constructs/security";
import { EnvironmentConfig } from "../config/dev";

interface AppStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const { config } = props;

    const auth = new AuthConstruct(this, "Auth", { config });
    const database = new DatabaseConstruct(this, "Database", { config });
    const lambdas = new LambdasConstruct(this, "Lambdas", { config, table: database.table });
    const api = new ApiConstruct(this, "Api", { config, lambdas: lambdas.functions, userPool: auth.userPool });
    new FrontendHostingConstruct(this, "FrontendHosting", { config });
    new MonitoringConstruct(this, "Monitoring", { config, lambdas: lambdas.functions, api: api.restApi });
    new SecurityConstruct(this, "Security", { config });
  }
}
