export interface EnvironmentConfig {
  projectName: string;
  stage: string;
  region: string;
  removalPolicy: "destroy" | "retain";
  enablePitr: boolean;
  enableWaf: boolean;
  lambdaMemory: number;
  lambdaTimeoutSeconds: number;
  sesFromEmail: string;
  sesToEmail: string;
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
  sesFromEmail: "andres@example.com",
  sesToEmail: "andres@example.com",
};
