import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RecaptchaService } from '@application/services/recaptcha.service';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly recaptchaService = new RecaptchaService();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const recaptchaToken = request.body?.recaptchaToken;

    if (!recaptchaToken) {
      throw new BadRequestException('reCAPTCHA token es requerido');
    }

    const isValid = await this.recaptchaService.verifyToken(recaptchaToken);

    if (!isValid) {
      throw new BadRequestException('Verificación de reCAPTCHA fallida');
    }

    return true;
  }
}
