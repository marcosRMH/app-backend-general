import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PortfolioController } from '@infrastructure/controllers/portfolio.controller';
import { PortfolioService } from '@application/services/portfolio.service';
import { RecaptchaService } from '@application/services/recaptcha.service';
import { RecaptchaGuard } from '@infrastructure/guards/recaptcha.guard';
import { appConfig } from '@infrastructure/config/env.config';
import { ConfigRepositoryDynamoDb } from '@infrastructure/persistence/dynamodb/config-repository.dynamodb';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    HttpModule,
  ],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    RecaptchaService,
    RecaptchaGuard,
    { provide: 'ConfigRepository', useClass: ConfigRepositoryDynamoDb },
  ],
})
export class PortfolioModule {}
