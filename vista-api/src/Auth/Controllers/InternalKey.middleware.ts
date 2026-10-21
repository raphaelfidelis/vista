import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Tamanho mínimo da INTERNAL_API_KEY: 32 caracteres = 192 bits ou mais. */
export const MIN_INTERNAL_KEY_LENGTH = 32;

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/**
 * Só o servidor do vista-web tem a chave: outro programa da máquina que
 * chame a API recebe 404, igual para rota que existe e que não existe. Roda
 * antes do roteamento, então nem revela quais rotas existem.
 */
export function createInternalKeyMiddleware(expectedKey: string) {
  const expected = sha256(expectedKey);

  return (request: Request, response: Response, next: NextFunction): void => {
    const sent = request.header('x-internal-key');

    if (sent !== undefined && timingSafeEqual(sha256(sent), expected)) {
      next();

      return;
    }

    response.status(404).json({ statusCode: 404, message: 'Not Found' });
  };
}
