import { CognitoIdentityProviderClient, InitiateAuthCommand, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoRepository } from "@domain/repositories/cognito-repository.interface";
import { Injectable } from "@nestjs/common";
import { InitiateAuthResponse } from "./interfaces/initiate-auth-response.interface";
import { RefreshTokenResponse } from "./interfaces/refresh-token-response.interface";

@Injectable()
export class AuthRepositoryCognito implements CognitoRepository  {

    private client: CognitoIdentityProviderClient;

    constructor() {
        this.client = new CognitoIdentityProviderClient({
        region: process.env.AWS_REGION || 'us-east-1',
        });
    }


    async initiateAuth(username: string, password: string): Promise<InitiateAuthResponse> {
        const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        });
        return this.client.send(command) as Promise<InitiateAuthResponse>;
    }

    async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
        const command = new InitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        });
        return this.client.send(command) as Promise<RefreshTokenResponse>;
    }

    async globalSignOut(accessToken: string): Promise<void> {
        const command = new GlobalSignOutCommand({
            AccessToken: accessToken,
        });
        await this.client.send(command);
    }

}