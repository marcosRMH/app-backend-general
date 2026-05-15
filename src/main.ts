import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '@infrastructure/modules/app.module';
import { appConfig } from '@infrastructure/config/env.config';
import { ConfigType } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const swaggerConfig = new DocumentBuilder()
    .setTitle('App Backend General')
    .setDescription('API con arquitectura hexagonal desplegada en AWS Lambda')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(config.port);
}
bootstrap();
