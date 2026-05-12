// Amplify v6 configuration.
// Values come from environment variables — never hardcoded.
//
// For local dev, create front/.env.local with:
//   VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
//   VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
//   VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
//   VITE_MEDIA_URL=https://xxxxxxxxxxxx.cloudfront.net
//
// Get these values from CloudFormation outputs after deploying AppStack:
//   aws cloudformation describe-stacks --stack-name portfolio-dev-AppStack \
//     --query "Stacks[0].Outputs" --output table --profile portfolio-dev

import type { ResourcesConfig } from "aws-amplify";

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
      loginWith: { email: true },
    },
  },
};

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL as string,
  mediaUrl: import.meta.env.VITE_MEDIA_URL as string,
};
