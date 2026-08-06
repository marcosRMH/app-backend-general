import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserController } from '@infrastructure/controllers/user.controller';
import { UserService } from '@application/services/user.service';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { appConfig } from '@infrastructure/config/env.config';
import { cognitoConfig } from '@infrastructure/config/cognito.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cognitoConfig],
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, RoleGuard],
})
export class UserModule {}
