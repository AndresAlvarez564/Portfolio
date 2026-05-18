import { EnvironmentConfig } from "./dev";

export const stagingConfig: EnvironmentConfig = {
  projectName: "portfolio",
  stage: "staging",
  region: "us-east-1",
  removalPolicy: "retain",
  enablePitr: true,
  enableWaf: false,
  lambdaMemory: 512,
  lambdaTimeoutSeconds: 15,
  sesFromEmail: "andresisaacalvaresherrera12@gmail.com",
  sesToEmail: "andresisaacalvaresherrera12@gmail.com",
};
