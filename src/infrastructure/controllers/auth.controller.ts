import { Controller, Post, Body, Headers, Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '@application/services/auth.service';
import { ResponseDto } from '@application/dto/response.dto';
import { LoginDto } from '@application/dto/auth/login.dto';
import { RefreshTokenDto } from '@application/dto/auth/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Login con email y password' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async login(@Body() dto: LoginDto): Promise<ResponseDto> {
    return this.service.login(dto);
  }

  @Post('refresh')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Renueva tokens usando refresh token' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<ResponseDto> {
    return this.service.refresh(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cierra sesion e invalida tokens' })
  @ApiResponse({ status: 200, type: ResponseDto })
  async logout(@Headers('authorization') authHeader: string): Promise<ResponseDto> {
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.service.logout(token);
  }
}
