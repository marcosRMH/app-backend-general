import { InitiateAuthResponse } from '@infrastructure/persistence/cognito/interfaces/initiate-auth-response.interface';
import { RefreshTokenResponse } from '@infrastructure/persistence/cognito/interfaces/refresh-token-response.interface';

export interface CognitoRepository {
  initiateAuth(username: string, password: string): Promise<InitiateAuthResponse>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
  globalSignOut(accessToken: string): Promise<void>;
}