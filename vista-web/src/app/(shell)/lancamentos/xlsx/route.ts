import type { NextRequest } from 'next/server';
import { fetchWithSession } from '@/lib/api.server';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * O .xlsx do mês passa por aqui: o navegador não tem o token (cookie
 * httpOnly) nem a chave interna, então não fala com a API direto.
 */
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('mes') ?? '';

  if (!MONTH.test(month)) {
    return new Response('Mês inválido', { status: 400 });
  }

  const response = await fetchWithSession(
    `reports/monthly/xlsx?month=${month}`,
  );

  if (!response.ok) {
    return new Response('Não foi possível gerar o relatório', { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type':
        response.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition':
        response.headers.get('content-disposition') ?? 'attachment',
      'Cache-Control': 'no-store',
    },
  });
}
