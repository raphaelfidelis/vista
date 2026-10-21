import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUnauthenticatedError } from '../Domain/Errors/AuthUnauthenticated.error';
import { AuthenticatedSession } from '../Domain/Services/Auth.service';
import { AuthGuard } from './Auth.guard';
import { AuthenticatedRequest } from './AuthenticatedRequest';

function setup(isPublic = false) {
  const auth = {
    register: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn<Promise<AuthenticatedSession>, [string]>(),
    logout: jest.fn(),
    rename: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
  };
  const reflector = {
    getAllAndOverride: jest.fn<boolean | undefined, unknown[]>(() => isPublic),
  } as unknown as Reflector;
  const request = {
    header: jest.fn<string | undefined, [string]>(),
  } as unknown as AuthenticatedRequest & {
    header: jest.Mock<string | undefined, [string]>;
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { auth, request, context, guard: new AuthGuard(reflector, auth) };
}

describe('AuthGuard', () => {
  it('rota pública passa sem olhar o token', async () => {
    const { guard, context, auth } = setup(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it('sem cabeçalho Authorization: 401', async () => {
    const { guard, context, request, auth } = setup();
    request.header.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it.each(['Basic abc', 'Bearer', 'Bearer ', 'bearer abc', 'abc'])(
    'cabeçalho %p que não é Bearer com token: 401',
    async (header) => {
      const { guard, context, request, auth } = setup();
      request.header.mockReturnValue(header);

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(auth.authenticate).not.toHaveBeenCalled();
    },
  );

  it('token gigante nem chega ao banco', async () => {
    const { guard, context, request, auth } = setup();
    request.header.mockReturnValue('Bearer ' + 'a'.repeat(201));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it('sessão inválida ou vencida: 401', async () => {
    const { guard, context, request, auth } = setup();
    request.header.mockReturnValue('Bearer token-1');
    auth.authenticate.mockRejectedValue(new AuthUnauthenticatedError());

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('token válido: libera e grava o usuário e a sessão na requisição', async () => {
    const { guard, context, request, auth } = setup();
    request.header.mockReturnValue('Bearer token-1');
    auth.authenticate.mockResolvedValue({
      userId: 'user-1',
      sessionId: 'session-1',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.authenticate).toHaveBeenCalledWith('token-1');
    expect(request.userId).toBe('user-1');
    expect(request.sessionId).toBe('session-1');
  });

  it('erro inesperado do banco não vira 401: sobe como está', async () => {
    const { guard, context, request, auth } = setup();
    request.header.mockReturnValue('Bearer token-1');
    auth.authenticate.mockRejectedValue(new Error('banco fora do ar'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      'banco fora do ar',
    );
  });
});
