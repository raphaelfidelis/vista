export type ProgressTone = 'accent' | 'warn' | 'over';

const TONES: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  warn: 'bg-warn',
  over: 'bg-over',
};

type ProgressBarProps = {
  /** 1 = 100%; passar de 1 enche a barra. */
  ratio: number;
  tone?: ProgressTone;
  label: string;
};

/** Barra proporcional em CSS. O `label` descreve o que ela mede, para leitores de tela. */
export function ProgressBar({
  ratio,
  tone = 'accent',
  label,
}: ProgressBarProps) {
  const filled = Math.min(1, Math.max(0, ratio));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(filled * 100)}
      className="bg-panel h-1.5"
    >
      <div
        className={`${TONES[tone]} h-full`}
        style={{ width: `${filled * 100}%` }}
      />
    </div>
  );
}
