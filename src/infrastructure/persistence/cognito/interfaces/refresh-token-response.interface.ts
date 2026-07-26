export interface RefreshTokenResponse {
  ChallengeParameters: Record<string, string>;
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    IdToken: string;
  };
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts: number;
    totalRetryDelay: number;
  };
}
