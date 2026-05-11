export interface EnvironmentConfig {
  projectName: string;
  stage: string;
  region: string;
  removalPolicy: "destroy" | "retain";
  enablePitr: boolean;
  enableWaf: boolean;
  lambdaMemory: number;
  lambdaTimeoutSeconds: number;
}

export const devConfig: EnvironmentConfig = {
  projectName: "portfolio",
  stage: "dev",
  region: "us-east-1",
  removalPolicy: "destroy",
  enablePitr: false,
  enableWaf: false,
  lambdaMemory: 256,
  lambdaTimeoutSeconds: 10,
};
