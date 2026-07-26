import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '@infrastructure/controllers/auth.controller';
import { AuthService } from '@application/services/auth.service';
import { AuthRepositoryCognito } from '@infrastructure/persistence/cognito/auth-repository.cognito';
import { appConfig } from '@infrastructure/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: 'CognitoRepository', useClass: AuthRepositoryCognito },
  ],
})
export class AuthModule {}
