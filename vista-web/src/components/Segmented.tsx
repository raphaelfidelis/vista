'use client';

type SegmentedProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Escolha de uma opção entre poucas, em botões lado a lado. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`flex-1 cursor-pointer px-3 py-2 text-[11px] font-bold tracking-[0.1em] ${
            option.value === value
              ? 'bg-accent text-on-accent'
              : 'bg-item text-secondary hover:bg-item-hover hover:text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
