import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUnauthenticatedError } from '../Domain/Errors/AuthUnauthenticated.error';
import { AUTH_SERVICE } from '../Domain/Services/Auth.service';
import type { AuthService } from '../Domain/Services/Auth.service';
import { AuthenticatedRequest } from './AuthenticatedRequest';
import { IS_PUBLIC_KEY } from './Public.decorator';

const BEARER_PREFIX = 'Bearer ';
/** Um token legítimo tem 43 caracteres: nada maior vale uma ida ao banco. */
const MAX_TOKEN_LENGTH = 200;

/** Global: toda rota exige sessão, menos as marcadas com @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_SERVICE)
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.header('authorization');
    const token = header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : '';

    if (token === '' || token.length > MAX_TOKEN_LENGTH) {
      throw new UnauthorizedException('Não autenticado');
    }

    try {
      const { userId, sessionId } = await this.auth.authenticate(token);

      request.userId = userId;
      request.sessionId = sessionId;

      return true;
    } catch (error) {
      if (error instanceof AuthUnauthenticatedError) {
        throw new UnauthorizedException('Não autenticado');
      }

      throw error;
    }
  }
}
