import { Controller, Post, Body, Get, Param, Put, UseGuards, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { UserService } from '@application/services/user.service';
import { ResponseDto } from '@application/dto/response.dto';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';

@ApiTags('Users')
@ApiBearerAuth()
@ApiHeader({ name: 'x-id-token', required: true, description: 'ID token emitido por Cognito, usado para obtener el rol' })
@Controller('user')
@UseGuards(AuthGuard, RoleGuard)
export class UserController {
  constructor(@Inject(UserService) private readonly service: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Crear usuario en Cognito' })
  @ApiResponse({ status: 201, type: ResponseDto })
  create(@Body() body: Record<string, unknown>): Promise<ResponseDto> {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, type: ResponseDto })
  findAll(): Promise<ResponseDto> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, type: ResponseDto })
  findById(@Param('id') id: string): Promise<ResponseDto> {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  @ApiResponse({ status: 200, type: ResponseDto })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>): Promise<ResponseDto> {
    return this.service.update(id, body);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Asignar/modificar rol' })
  @ApiResponse({ status: 200, type: ResponseDto })
  assignRole(@Param('id') id: string, @Body() body: Record<string, unknown>): Promise<ResponseDto> {
    return this.service.assignRole(id, body);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Resetear contraseña' })
  @ApiResponse({ status: 200, type: ResponseDto })
  resetPassword(@Param('id') id: string): Promise<ResponseDto> {
    return this.service.resetPassword(id);
  }
}
