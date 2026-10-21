import type { NextConfig } from 'next';

/** Valem para toda resposta; a CSP, que muda a cada requisição, vem do proxy.ts. */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // A URL nunca vaza para outro site (nem o code do login com Google). Não é
  // no-referrer: com ele o navegador manda Origin: null no POST de formulário
  // sem JavaScript, e o Next recusa a Server Action como se fosse CSRF.
  { key: 'Referrer-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
