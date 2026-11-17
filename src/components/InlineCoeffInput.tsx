import React, { useState, useEffect } from 'react';

interface InlineCoeffInputProps {
  value: number;
  onChange: (newCoeff: number) => void;
  variant?: 'bulletin' | 'badge';
  min?: number;
  max?: number;
  title?: string;
}

export const InlineCoeffInput: React.FC<InlineCoeffInputProps> = ({
  value,
  onChange,
  variant = 'bulletin',
  min = 1,
  max = 20,
  title = 'Cliquer pour modifier le coefficient de cette matière',
}) => {
  const [draft, setDraft] = useState<string>(String(value || 1));

  useEffect(() => {
    setDraft(String(value || 1));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      if (parsed !== value) {
        onChange(parsed);
      }
      setDraft(String(parsed));
    } else {
      setDraft(String(value || 1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max && parsed !== value) {
      onChange(parsed);
    }
  };

  if (variant === 'badge') {
    return (
      <div
        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800"
        onClick={(e) => e.stopPropagation()}
        title={title}
      >
        <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase">
          Coeff.
        </span>
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={draft}
          onChange={handleChange}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(draft);
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label="Coefficient de la matière"
          className="w-11 px-1 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-center font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    );
  }

  return (
    <>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={handleChange}
        onBlur={() => commit(draft)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
        title={title}
        aria-label="Modifier le coefficient"
        className="print:hidden w-10 px-0.5 py-0.5 text-center font-black text-slate-900 bg-purple-50/80 hover:bg-purple-100 focus:bg-white border border-purple-300 focus:border-purple-600 rounded outline-none text-[10px] transition-colors"
      />
      <span className="hidden print:inline font-bold text-slate-800">{value}</span>
    </>
  );
};
