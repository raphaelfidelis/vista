import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import {
  createInternalKeyMiddleware,
  MIN_INTERNAL_KEY_LENGTH,
} from './Auth/Controllers/InternalKey.middleware';

/** Dado financeiro nunca fica em cache, e o navegador não adivinha o tipo da resposta. */
function securityHeaders(_: Request, response: Response, next: NextFunction) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const internalKey = config.getOrThrow<string>('INTERNAL_API_KEY');

  if (internalKey.length < MIN_INTERNAL_KEY_LENGTH) {
    throw new Error(
      `INTERNAL_API_KEY deve ter ao menos ${MIN_INTERNAL_KEY_LENGTH} caracteres`,
    );
  }

  app.disable('x-powered-by');
  // Antes de tudo, inclusive do roteamento: sem a chave do vista-web, 404 igual para qualquer rota.
  app.use(createInternalKeyMiddleware(internalKey));
  app.use(securityHeaders);
  app.useBodyParser('json', { limit: '100kb' });

  // A API só atende o servidor do vista-web: sem host explícito o Node
  // escuta em todas as interfaces, e qualquer aparelho da rede a alcança.
  await app.listen(
    config.getOrThrow<string>('PORT'),
    config.getOrThrow<string>('HOST'),
  );
}

void bootstrap();
