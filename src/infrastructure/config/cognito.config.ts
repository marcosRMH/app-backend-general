import { registerAs } from '@nestjs/config';

export const cognitoConfig = registerAs('cognito', () => ({
  userPoolId: process.env.COGNITO_USER_POOL_ID || '',
  clientId: process.env.COGNITO_CLIENT_ID || '',
  region: process.env.AWS_REGION || 'us-east-1',
}));
