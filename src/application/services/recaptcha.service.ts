import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

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
  private readonly secretKey: string = process.env.RECAPTCHA_SECRET_KEY || '';
  private readonly minScore: number = 0.5;

  async verifyToken(token: string): Promise<boolean> {
    if (!this.secretKey) {
      throw new HttpException('reCAPTCHA no configurado', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });

    const { data } = await axios.post<RecaptchaResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      payload.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
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
