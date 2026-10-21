import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { connection } from 'next/server';
import { ICON_FONT_URL } from '@/lib/icons';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

/** viewport-fit=cover: no iPhone a barra inferior desenha sob o indicador e usa o safe-area. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Vista',
  description: 'Dashboard pessoal',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // A CSP usa uma nonce por requisição: nenhuma página pode ser estática.
  await connection();

  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link href={ICON_FONT_URL} rel="stylesheet" />
      </head>
      <body className="bg-app text-primary flex min-h-full flex-col font-mono">
        {children}
      </body>
    </html>
  );
}
