import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './AuthenticatedRequest';

/** Limite do IP guardado: o cabeçalho é texto livre e vira chave do limite de tentativas. */
const MAX_IP_LENGTH = 64;

function requestOf(context: ExecutionContext): AuthenticatedRequest {
  return context.switchToHttp().getRequest<AuthenticatedRequest>();
}

/** O dono dos dados, vindo da sessão. Só existe em rota protegida. */
export const CurrentUserId = createParamDecorator(
  (_: unknown, context: ExecutionContext): string =>
    requestOf(context).userId as string,
);

export const CurrentSessionId = createParamDecorator(
  (_: unknown, context: ExecutionContext): string =>
    requestOf(context).sessionId as string,
);

/**
 * O IP real de quem usa o navegador. A API só recebe chamadas do servidor do
 * web, então ele chega no X-Client-IP: só vale porque a chamada já passou
 * pela chave interna.
 */
export const ClientIp = createParamDecorator(
  (_: unknown, context: ExecutionContext): string => {
    const header = requestOf(context).header('x-client-ip');

    return header ? header.slice(0, MAX_IP_LENGTH) : 'unknown';
  },
);
