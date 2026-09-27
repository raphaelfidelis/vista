import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // O navegador chama a API direto: é ele quem tem as coordenadas do usuário.
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });

  await app.listen(config.getOrThrow<string>('PORT'));
}

void bootstrap();
