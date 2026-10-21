import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/session.server';

const API_URL = process.env.API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!API_URL || !INTERNAL_API_KEY) {
  throw new Error(
    'API_URL e INTERNAL_API_KEY não definidas. Veja o .env.local.example.',
  );
}

/**
 * Base terminada em barra e caminhos relativos: `new URL('/reports', base)`
 * descartaria um prefixo como `/api` da base.
 */
const API_BASE = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

/** Erro de regra de negócio da API: a mensagem é para o usuário. */
export class ApiError extends Error {}

type ErrorBody = { message?: string | string[] };

type RequestInit = { method?: string; body?: unknown };

/** Respostas de erro com mensagem para a tela; o resto vai para o error.tsx. */
const SESSION_MESSAGES = [400, 404, 409, 429];
const PUBLIC_MESSAGES = [400, 401, 403, 404, 409, 429, 503];

function messageOf(body: ErrorBody | null, status: number): string {
  const message = body?.message;

  if (Array.isArray(message)) {
    return message.join('. ');
  }

  return message ?? `Erro ${status}`;
}

/** Toda chamada leva a chave interna: sem ela a API responde 404 a qualquer rota. */
async function send(
  path: string,
  init: RequestInit,
  extra: Record<string, string>,
): Promise<Response> {
  const hasBody = init.body !== undefined;

  return fetch(new URL(path, API_BASE), {
    method: init.method ?? 'GET',
    cache: 'no-store',
    headers: {
      'x-internal-key': INTERNAL_API_KEY as string,
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...extra,
    },
    body: hasBody ? JSON.stringify(init.body) : undefined,
  }).catch(() => {
    throw new Error('Não foi possível conectar à API. Ela está rodando?');
  });
}

async function parse<T>(
  response: Response,
  path: string,
  withMessage: number[],
): Promise<T> {
  if (response.ok) {
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }

  if (withMessage.includes(response.status)) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;

    throw new ApiError(messageOf(body, response.status));
  }

  throw new Error(`A API respondeu ${response.status} em ${path}`);
}

/**
 * Chamada em nome de quem está logado. Sem sessão, ou com a sessão vencida
 * (401), manda para a tela de entrar.
 */
export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetchWithSession(path, init);

  return parse<T>(response, path, SESSION_MESSAGES);
}

/** Resposta crua (ex.: o .xlsx), já com a sessão; sem sessão redireciona. */
export async function fetchWithSession(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    redirect('/entrar');
  }

  const response = await send(path, init, {
    authorization: `Bearer ${token}`,
  });

  if (response.status === 401) {
    redirect('/entrar');
  }

  return response;
}

/**
 * Login e cadastro: sem sessão, mas com o IP de quem usa o navegador, para o
 * limite de tentativas da API valer por pessoa e não para o servidor inteiro.
 */
export async function requestPublicApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await send(path, init, {
    'x-client-ip': await clientIp(),
  });

  return parse<T>(response, path, PUBLIC_MESSAGES);
}

async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get('x-forwarded-for');

  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
