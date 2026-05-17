import { Controller, Post, Body, Headers, UsePipes, ValidationPipe, UseGuards, Inject, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RecaptchaGuard } from '@infrastructure/guards/recaptcha.guard';
import { PortfolioService } from '@application/services/portfolio.service';
import { ResponseDto } from '@application/dto/response.dto';
import { PortfolioSendMessageResponseDto } from '@application/dto/portfolio-send-message.dto';
import { XNamePortalHeaderDto } from '@application/dto/x-name-portal.header.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(@Inject(PortfolioService) private readonly service: PortfolioService) {}
   
   @Post('send-message')
   @UseGuards(RecaptchaGuard)
   @UsePipes(new ValidationPipe({ whitelist: true }))
   @ApiOperation({ summary: 'envia un mensaje desde el portal' })
   @ApiResponse({ status: 201, type: ResponseDto })
   async sendMessage(
     @Headers('x-name-portal') portalHeader: string,
     @Body() dto: PortfolioSendMessageResponseDto
   ): Promise<ResponseDto> {
     const headerDto = plainToInstance(XNamePortalHeaderDto, { 'x-name-portal': portalHeader });
     await validateOrReject(headerDto)
       .catch((errors) => {
         throw new BadRequestException(errors);
       });
   
     return this.service.sendMessage(portalHeader, dto);
   }

   @Get('multilanguage/:type')
   @UsePipes(new ValidationPipe({ whitelist: true }))
   @ApiParam({ name: 'type', required: true, description: 'Tipo de configuracion (ej: idioma)' })
   @ApiOperation({ summary: 'Obtiene la configuracion por tipo' })
   @ApiResponse({ status: 201, type: ResponseDto })
   async getConfig(
    @Param('type') type: string,
    @Headers('x-name-portal') portalHeader: string,
   ): Promise<ResponseDto>{
      const headerDto = plainToInstance(XNamePortalHeaderDto, { 'x-name-portal': portalHeader });
      await validateOrReject(headerDto)
       .catch((errors) => {
         throw new BadRequestException(errors);
       });
   
     return this.service.getMultilanguage(portalHeader, type);
   }
}
