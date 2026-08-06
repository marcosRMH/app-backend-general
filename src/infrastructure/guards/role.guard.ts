import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role = request.user?.['custom:role'];

    if (!role || role.trim() === '') {
      throw new ForbiddenException('El token debe contener un rol no vacío');
    }

    return true;
  }
}
