'use client';

import { useAccent } from '@/components/AccentProvider';
import { accents } from '@/lib/accents';

export function ThemeSwitcher() {
  const { accent, selectAccent } = useAccent();

  return (
    <div className="border-line flex flex-col gap-2 border p-2.5">
      <span
        id="tema-label"
        className="text-dim text-[10px] tracking-[0.2em] whitespace-nowrap"
      >
        TEMA
      </span>
      <div
        role="radiogroup"
        aria-labelledby="tema-label"
        className="flex flex-wrap justify-center gap-2.5"
      >
        {accents.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-label={option.label}
            aria-checked={option.value === accent}
            onClick={() => selectAccent(option.value)}
            style={{ backgroundColor: option.value }}
            className={`size-5 shrink-0 cursor-pointer outline-offset-2 ${
              option.value === accent
                ? 'outline-primary outline-2'
                : 'outline-line outline-1'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
