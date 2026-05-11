import { EnvironmentConfig } from "./dev";

export const prodConfig: EnvironmentConfig = {
  projectName: "portfolio",
  stage: "prod",
  region: "us-east-1",
  removalPolicy: "retain",
  enablePitr: true,
  enableWaf: true,
  lambdaMemory: 512,
  lambdaTimeoutSeconds: 15,
};
