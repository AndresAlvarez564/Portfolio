import { EnvironmentConfig } from "./dev";

export const stagingConfig: EnvironmentConfig = {
  projectName: "<project-name>",
  stage: "staging",
  region: "us-east-1",
  removalPolicy: "retain",
  enablePitr: true,
  enableWaf: false,
  lambdaMemory: 512,
  lambdaTimeoutSeconds: 15,
};
