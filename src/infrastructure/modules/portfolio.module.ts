import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PortfolioController } from '@infrastructure/controllers/portfolio.controller';
import { PortfolioService } from '@application/services/portfolio.service';
import { RecaptchaGuard } from '@infrastructure/guards/recaptcha.guard';
import { appConfig } from '@infrastructure/config/env.config';
import { ConfigRepositoryDynamoDb } from '@infrastructure/persistence/dynamodb/config-repository.dynamodb';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
  ],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    RecaptchaGuard,
    { provide: 'ConfigRepository', useClass: ConfigRepositoryDynamoDb },
  ],
})
export class PortfolioModule {}
