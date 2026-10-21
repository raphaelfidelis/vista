import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/** Telas que abrem sem sessão. */
const PUBLIC_PATHS = ['/entrar', '/criar-conta'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * CSP com nonce nova a cada requisição: só os scripts que o próprio Next
 * gerou rodam. O atributo style fica liberado (barras de progresso, gráfico,
 * cor de destaque); estilos e fontes externos, só os do Google Fonts.
 */
function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Em dev o Turbopack injeta o CSS em <style> sem nonce; com nonce presente o
    // navegador ignoraria o 'unsafe-inline', então em dev vai só ele. Em produção, nonce.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`} https://fonts.googleapis.com`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${isDev ? ' ws:' : ''}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; ');
}

/**
 * Checagem otimista: só olha se o cookie existe. Quem decide se a sessão
 * vale é a API, a cada chamada; com o cookie vencido, a primeira chamada
 * manda para /entrar. Por isso quem tem cookie não é tirado de /entrar:
 * um cookie vencido criaria um laço de redirecionamentos.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPublic(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/entrar', request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', policy);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'],
};
