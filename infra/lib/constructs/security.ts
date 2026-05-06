import { Construct } from "constructs";
import { EnvironmentConfig } from "../../config/dev";

interface SecurityConstructProps {
  config: EnvironmentConfig;
}

export class SecurityConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // TODO: add WAF when config.enableWaf is true
    // TODO: add KMS keys for sensitive data
    // TODO: add Secrets Manager secrets
    // TODO: add Parameter Store parameters
  }
}
