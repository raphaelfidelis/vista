type ErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <span className="text-dim text-xs tracking-[0.24em]">{title}</span>
      <p className="text-secondary max-w-md text-center text-[11px]">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-accent text-on-accent cursor-pointer px-4 py-2 text-[11px] font-bold tracking-[0.1em]"
      >
        TENTAR NOVAMENTE
      </button>
    </div>
  );
}
