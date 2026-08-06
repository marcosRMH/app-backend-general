import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class AuthGuard implements CanActivate {
  private accessVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;
  private idVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

  private getAccessVerifier() {
    if (!this.accessVerifier) {
      this.accessVerifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID || '',
        tokenUse: 'access',
        clientId: process.env.COGNITO_CLIENT_ID || '',
      });
    }
    return this.accessVerifier;
  }

  private getIdVerifier() {
    if (!this.idVerifier) {
      this.idVerifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID || '',
        tokenUse: 'id',
        clientId: process.env.COGNITO_CLIENT_ID || '',
      });
    }
    return this.idVerifier;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const idTokenHeader: string | undefined = request.headers?.['x-id-token'];
    if (!idTokenHeader || idTokenHeader.trim() === '') {
      throw new UnauthorizedException('ID token requerido en el header x-id-token');
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const idToken = idTokenHeader.trim();

    try {
      const accessPayload = await this.getAccessVerifier().verify(accessToken);
      const idPayload = await this.getIdVerifier().verify(idToken);

      if (accessPayload.sub !== idPayload.sub) {
        throw new UnauthorizedException('Los tokens no pertenecen al mismo usuario');
      }

      request.user = idPayload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
