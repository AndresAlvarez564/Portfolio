import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface SecurityConstructProps {
  config: EnvironmentConfig;
}

export class SecurityConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // TODO: add KMS keys for sensitive data if needed
    // TODO: add Secrets Manager secrets if third-party API keys are required
    // TODO: add Parameter Store parameters for environment configuration
    // Note: WAF is not used in this project
  }
}
