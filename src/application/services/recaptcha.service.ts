import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly minScore: number = 0.5;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('app.recaptchaSecretKey') || '';
  }

  async verifyToken(token: string): Promise<boolean> {
    if (!this.secretKey) {
      throw new HttpException('reCAPTCHA no configurado', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });

    const { data } = await firstValueFrom(
      this.httpService.post<RecaptchaResponse>(
        'https://www.google.com/recaptcha/api/siteverify',
        payload.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ),
    );

    if (!data.success) {
      return false;
    }

    if (data.score !== undefined && data.score < this.minScore) {
      return false;
    }

    return true;
  }
}
