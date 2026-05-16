import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from '@infrastructure/controllers/app.controller';
import { AppService } from '@application/services/app.service';
import { PortfolioService } from '@application/services/portfolio.service';
import { RecaptchaService } from '@application/services/recaptcha.service';
import { RecaptchaGuard } from '@infrastructure/guards/recaptcha.guard';
import { PortfolioController } from '@infrastructure/controllers/portfolio.controller';
import { ConfigRepositoryDynamoDb } from '@infrastructure/persistence/dynamodb/config-repository.dynamodb';
import { appConfig } from '@infrastructure/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    HttpModule,
  ],
  controllers: [AppController, PortfolioController],
  providers: [
    AppService,
    PortfolioService,
    RecaptchaService,
    RecaptchaGuard,
    { provide: 'ConfigRepository', useClass: ConfigRepositoryDynamoDb },
  ],
})
export class AppModule {}
