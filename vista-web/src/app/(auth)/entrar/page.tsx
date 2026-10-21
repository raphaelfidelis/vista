import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Entrar · Vista' };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-dim text-[11px] tracking-[0.22em]">ENTRAR</h1>
      <LoginForm />
      <p className="text-muted text-xs">
        Não tem conta?{' '}
        <Link href="/criar-conta" className="text-accent hover:underline">
          Criar conta
        </Link>
      </p>
    </>
  );
}
