import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // O navegador chama a API direto: é ele quem tem as coordenadas do usuário.
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });

  // A API não tem autenticação e guarda dado financeiro: sem host explícito o
  // Node escuta em todas as interfaces, e qualquer aparelho da rede a alcança.
  await app.listen(
    config.getOrThrow<string>('PORT'),
    config.getOrThrow<string>('HOST'),
  );
}

void bootstrap();
