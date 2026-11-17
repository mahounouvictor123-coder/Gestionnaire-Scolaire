import React, { useState, useEffect, useRef } from 'react';

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
  const isFocusedRef = useRef(false);
  const justFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(String(value || 1));
    }
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw.trim(), 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      if (clamped !== value) {
        onChange(clamped);
      }
      setDraft(String(clamped));
    } else {
      setDraft(String(value || 1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setDraft(raw);
    if (raw === '') return;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max && parsed !== value) {
      onChange(parsed);
    }
  };

  const sharedInputProps = {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    value: draft,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const inputEl = e.currentTarget;
      isFocusedRef.current = true;
      justFocusedRef.current = true;
      inputEl.select();
      requestAnimationFrame(() => {
        if (document.activeElement === inputEl) {
          inputEl.select();
        }
      });
    },
    onMouseUp: (e: React.MouseEvent<HTMLInputElement>) => {
      if (justFocusedRef.current) {
        e.preventDefault();
        justFocusedRef.current = false;
      }
    },
    onChange: handleChange,
    onBlur: () => {
      isFocusedRef.current = false;
      justFocusedRef.current = false;
      commit(draft);
    },
    onClick: (e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        isFocusedRef.current = false;
        justFocusedRef.current = false;
        commit(draft);
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        isFocusedRef.current = false;
        justFocusedRef.current = false;
        setDraft(String(value || 1));
        (e.target as HTMLInputElement).blur();
      }
    },
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
          {...sharedInputProps}
          aria-label="Coefficient de la matière"
          className="w-11 px-1 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-center font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
        />
      </div>
    );
  }

  return (
    <>
      <input
        {...sharedInputProps}
        title={title}
        aria-label="Modifier le coefficient"
        className="print:hidden w-10 min-w-[36px] px-0.5 py-0.5 text-center font-black text-slate-900 bg-purple-50/90 hover:bg-purple-100 focus:bg-white border border-purple-300 focus:border-purple-600 rounded outline-none text-[10px] transition-colors cursor-text"
      />
      <span className="hidden print:inline font-bold text-slate-800">{value}</span>
    </>
  );
};
