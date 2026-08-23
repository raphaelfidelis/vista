'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ShellError({ error, retry }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <span className="text-dim text-xs tracking-[0.24em]">
        FALHA AO CARREGAR O MÓDULO
      </span>
      <p className="text-secondary max-w-md text-center text-[11px]">
        {error.message}
      </p>
      <button
        type="button"
        onClick={retry}
        className="bg-accent text-on-accent cursor-pointer px-4 py-2 text-[11px] font-bold tracking-[0.1em]"
      >
        TENTAR NOVAMENTE
      </button>
    </div>
  );
}
