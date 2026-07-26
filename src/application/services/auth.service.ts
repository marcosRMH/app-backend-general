import { Inject, Injectable } from '@nestjs/common';
import { LoginDto } from '@application/dto/auth/login.dto';
import { RefreshTokenDto } from '@application/dto/auth/refresh-token.dto';
import { TokenResponseDto } from '@application/dto/auth/token-response.dto';
import { ResponseDto } from '@application/dto/response.dto';
import { CognitoRepository } from '@domain/repositories/cognito-repository.interface';
import { extractCognitoGroups } from '@application/commons/jwt-decoder.util';
import { ResponseMapper } from '@application/mappers/response.mapper';

@Injectable()
export class AuthService {
    constructor(
      @Inject('CognitoRepository')
      private readonly repositoryCognito: CognitoRepository,
    ) {}

  async login(dto: LoginDto): Promise<ResponseDto> {
    
    const auth = await this.repositoryCognito.initiateAuth(dto.email,dto.password);
    const groups = extractCognitoGroups(auth.AuthenticationResult.AccessToken);
    
    return ResponseMapper.toResponse({
      code: 200,
      status: 'OK',
      message: 'Login exitoso',
      detail: [],
      data: {
        accessToken: auth.AuthenticationResult.AccessToken,
        refreshToken: auth.AuthenticationResult.RefreshToken,
        expiresIn: auth.AuthenticationResult.ExpiresIn,
        tokenType: auth.AuthenticationResult.TokenType,
        idToken: auth.AuthenticationResult.IdToken,
        groups: groups,
      } as TokenResponseDto,
    });
  }

  async refresh(dto: RefreshTokenDto): Promise<ResponseDto> {
    const auth = await this.repositoryCognito.refreshToken(dto.refreshToken);
    const groups = extractCognitoGroups(auth.AuthenticationResult.AccessToken);

    return ResponseMapper.toResponse({
      code: 200,
      status: 'OK',
      message: 'Token renovado',
      detail: [],
      data: {
        accessToken: auth.AuthenticationResult.AccessToken,
        expiresIn: auth.AuthenticationResult.ExpiresIn,
        tokenType: auth.AuthenticationResult.TokenType,
        groups: groups,
      } as TokenResponseDto,
    });
  }

  async logout(accessToken: string): Promise<ResponseDto> {
    await this.repositoryCognito.globalSignOut(accessToken);

    return ResponseMapper.toResponse({
      code: 200,
      status: 'OK',
      message: 'Sesión cerrada correctamente',
      detail: [],
    });
  }
}
