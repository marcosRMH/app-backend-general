import { Controller, Get, Post, Delete, Param, Body, Headers, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PortfolioService } from '@application/services/portfolio.service';
import { ResponseDto } from '@application/dto/response.dto';
import { PortfolioSendMessageResponseDto } from '@application/dto/portfolio-send-message.dto';
import { XNamePortalHeaderDto } from '@application/dto/x-name-portal.header.dto';

@ApiTags('Portfolio')
@Controller('portfolio/send-message')
export class PortfolioController {
  constructor(@Inject(PortfolioService) private readonly service: PortfolioService) {}
   
   @Post()
     @UsePipes(new ValidationPipe({ whitelist: true }))
     @ApiOperation({ summary: 'envia un mensaje desde el portal' })
     @ApiResponse({ status: 201, type: ResponseDto })
     async sendMessage(
       @Headers('x-name-portal') portalHeader: string,
       @Body() dto: PortfolioSendMessageResponseDto
     ): Promise<ResponseDto> {
      console.log("ENTRANDO AL CONTROLLER")
       const headerDto = plainToInstance(XNamePortalHeaderDto, { 'x-name-portal': portalHeader });
       await validateOrReject(headerDto)
         .catch((errors) => {
           throw new BadRequestException(errors);
         });
     
       return this.service.sendMessage(portalHeader, dto);
     }
}
