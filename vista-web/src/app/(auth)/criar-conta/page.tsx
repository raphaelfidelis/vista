import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = { title: 'Criar conta · Vista' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-dim text-[11px] tracking-[0.22em]">CRIAR CONTA</h1>
      <RegisterForm />
      <p className="text-muted text-xs">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
