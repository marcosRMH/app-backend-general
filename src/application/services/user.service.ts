import { Injectable } from '@nestjs/common';
import { ResponseDto } from '@application/dto/response.dto';
import { ResponseMapper } from '@application/mappers/response.mapper';

@Injectable()
export class UserService {
  create(payload: Record<string, unknown>): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Crear usuario',
        detail: [],
        data: payload,
      }),
    );
  }

  findAll(): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Listar usuarios',
        detail: [],
        data: [],
      }),
    );
  }

  findById(id: string): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Obtener usuario',
        detail: [],
        data: { id },
      }),
    );
  }

  update(id: string, payload: Record<string, unknown>): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Actualizar usuario',
        detail: [],
        data: { id, ...payload },
      }),
    );
  }

  assignRole(id: string, payload: Record<string, unknown>): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Asignar rol',
        detail: [],
        data: { id, ...payload },
      }),
    );
  }

  resetPassword(id: string): Promise<ResponseDto> {
    return Promise.resolve(
      ResponseMapper.toResponse({
        code: 200,
        status: 'OK',
        message: 'Resetear contraseña',
        detail: [],
        data: { id },
      }),
    );
  }
}
