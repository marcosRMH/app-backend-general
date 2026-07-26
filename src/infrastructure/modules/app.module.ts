import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@infrastructure/controllers/app.controller';
import { AppService } from '@application/services/app.service';
import { PortfolioService } from '@application/services/portfolio.service';
import { RecaptchaGuard } from '@infrastructure/guards/recaptcha.guard';
import { PortfolioController } from '@infrastructure/controllers/portfolio.controller';
import { AuthController } from '@infrastructure/controllers/auth.controller';
import { AuthService } from '@application/services/auth.service';
import { ConfigRepositoryDynamoDb } from '@infrastructure/persistence/dynamodb/config-repository.dynamodb';
import { AuthRepositoryCognito } from '@infrastructure/persistence/cognito/auth-repository.cognito';
import { appConfig } from '@infrastructure/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
  ],
  controllers: [AppController, PortfolioController, AuthController],
  providers: [
    AppService,
    PortfolioService,
    RecaptchaGuard,
    AuthService,
    { provide: 'ConfigRepository', useClass: ConfigRepositoryDynamoDb },
    { provide: 'CognitoRepository', useClass: AuthRepositoryCognito },
  ],
})
export class AppModule {}
