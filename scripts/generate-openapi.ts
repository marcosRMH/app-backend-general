import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/infrastructure/modules/app.module';
import { PortfolioModule } from '../src/infrastructure/modules/portfolio.module';
import { AuthModule } from '../src/infrastructure/modules/auth.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('App Backend General')
    .setDescription('API con arquitectura hexagonal')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await app.close();

  const portfolioApp = await NestFactory.create(PortfolioModule);
  const portfolioDoc = SwaggerModule.createDocument(portfolioApp, config);
  await portfolioApp.close();

  const authApp = await NestFactory.create(AuthModule);
  const authDoc = SwaggerModule.createDocument(authApp, config);
  await authApp.close();

  const merged = {
    ...document,
    paths: { ...document.paths, ...portfolioDoc.paths, ...authDoc.paths },
    components: {
      schemas: {
        ...(document.components?.schemas || {}),
        ...(portfolioDoc.components?.schemas || {}),
        ...(authDoc.components?.schemas || {}),
      },
    },
  };

  const outputPath = path.join(__dirname, '..', 'cdk', 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`OpenAPI spec generated at ${outputPath}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
