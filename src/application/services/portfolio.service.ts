import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PortfolioSendMessageResponseDto } from '@application/dto/portfolio-send-message.dto';
import { ResponseMapper } from '@application/mappers/response.mapper';
import { ResponseDto } from '@application/dto/response.dto';
import { ConfigRepository } from '@domain/repositories/config-repository.interface';
import { MailService } from '@application/commons/send-email.util';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject('ConfigRepository')
    private readonly repositoryDynamoConfig: ConfigRepository,
  ) {}

  async sendMessage(portal: string, dto: PortfolioSendMessageResponseDto): Promise<ResponseDto> {
    try {
      const configDynamoPortal = await this.repositoryDynamoConfig.findById(portal);
      const dt = new MailService();
      const phoneStr = dto.phone !== undefined ? dto.phone.toString() : '';
      await dt.sendMail(configDynamoPortal.CORREO_CONFIG.email, configDynamoPortal.CORREO_CONFIG.password, configDynamoPortal.CORREO_CONFIG.to, dto.message, configDynamoPortal.CORREO_CONFIG.subjectPortfolio, "", phoneStr, dto.email);
      return ResponseMapper.toResponse({ code: 200, detail: [], message: "", status: "ok" });
    } catch (e) {
      console.log(e);
      return ResponseMapper.toResponse({ code: 500, detail: [], message: "", status: "ok" });
    }
  }
}