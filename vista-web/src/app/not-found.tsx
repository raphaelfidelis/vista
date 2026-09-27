import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <span className="text-dim text-xs tracking-[0.24em]">
        404 · PÁGINA NÃO ENCONTRADA
      </span>
      <Link
        href="/"
        className="bg-accent text-on-accent px-4 py-2 text-[11px] font-bold tracking-[0.1em]"
      >
        VOLTAR AO INÍCIO
      </Link>
    </main>
  );
}
