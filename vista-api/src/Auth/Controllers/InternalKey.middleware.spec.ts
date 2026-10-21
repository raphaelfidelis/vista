import type { NextFunction, Request, Response } from 'express';
import { createInternalKeyMiddleware } from './InternalKey.middleware';

const KEY = 'k'.repeat(40);

function run(sent: string | undefined) {
  const middleware = createInternalKeyMiddleware(KEY);
  const request = {
    header: (name: string) => (name === 'x-internal-key' ? sent : undefined),
  } as unknown as Request;
  const json = jest.fn();
  const status = jest.fn<unknown, [number]>(() => ({ json }));
  const response = { status } as unknown as Response;
  const next = jest.fn<void, []>();

  middleware(request, response, next as NextFunction);

  return { next, status, json };
}

describe('createInternalKeyMiddleware', () => {
  it('com a chave certa segue adiante', () => {
    const { next, status } = run(KEY);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('sem a chave: 404, sem seguir', () => {
    const { next, status, json } = run(undefined);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Not Found',
    });
  });

  it.each(['', 'errada', KEY + 'x', KEY.slice(0, -1), KEY.toUpperCase()])(
    'chave %p: 404',
    (sent) => {
      const { next, status } = run(sent);

      expect(next).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(404);
    },
  );

  it('a resposta não depende de quão perto a chave chegou', () => {
    const wrong = run('a'.repeat(40));
    const almost = run(KEY.slice(0, -1) + 'x');

    expect(wrong.json.mock.calls).toEqual(almost.json.mock.calls);
  });
});
