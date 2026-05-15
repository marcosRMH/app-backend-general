import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@infrastructure/controllers/app.controller';
import { AppService } from '@application/services/app.service';
import { PortfolioService } from '@application/services/portfolio.service';
import { PortfolioController } from '@infrastructure/controllers/portfolio.controller';
import { ConfigRepositoryDynamoDb } from '@infrastructure/persistence/dynamodb/config-repository.dynamodb';
import { appConfig } from '@infrastructure/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    
  ],
  controllers: [AppController, PortfolioController],
  providers: [
    AppService,
    PortfolioService,
    { provide: 'ConfigRepository', useClass: ConfigRepositoryDynamoDb },
  ],
})
export class AppModule {}
