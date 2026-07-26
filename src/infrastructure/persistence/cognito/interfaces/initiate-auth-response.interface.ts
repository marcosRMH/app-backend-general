export interface InitiateAuthResponse {
  ChallengeParameters: Record<string, string>;
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    RefreshToken: string;
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
