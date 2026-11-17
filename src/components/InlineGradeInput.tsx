import React, { useState, useEffect, useRef } from 'react';

interface InlineGradeInputProps {
  value?: number;
  onSave: (newMark: number | null) => void;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
}

export const InlineGradeInput: React.FC<InlineGradeInputProps> = ({
  value,
  onSave,
  disabled = false,
  title = 'Cliquer pour renseigner ou modifier la note (/20)',
  placeholder = '-',
}) => {
  const formatDisplay = (v?: number) => (v !== undefined && !Number.isNaN(v) ? v.toFixed(2) : '');

  const [draft, setDraft] = useState<string>(() => formatDisplay(value));
  const isFocusedRef = useRef(false);
  const justFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(formatDisplay(value));
    }
  }, [value]);

  const parseNormalized = (raw: string): number | null => {
    const cleaned = raw.replace(',', '.').trim();
    if (cleaned === '') return null;
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return NaN;
    const clamped = Math.min(20, Math.max(0, num));
    return Math.round(clamped * 100) / 100;
  };

  const commit = (raw: string) => {
    const parsed = parseNormalized(raw);
    if (parsed === null) {
      if (value !== undefined) {
        onSave(null);
      }
      setDraft('');
      return;
    }
    if (Number.isNaN(parsed)) {
      setDraft(formatDisplay(value));
      return;
    }
    if (value === undefined || Math.abs(parsed - value) > 0.001) {
      onSave(parsed);
    }
    setDraft(parsed.toFixed(2));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Autoriser chiffres et point/virgule décimaux pendant la saisie
    if (raw !== '' && !/^\d*(?:[.,]\d{0,2})?$/.test(raw)) {
      return;
    }
    setDraft(raw);

    if (raw.trim() === '' || raw.endsWith('.') || raw.endsWith(',')) {
      return;
    }
    const parsed = parseNormalized(raw);
    if (parsed !== null && !Number.isNaN(parsed)) {
      if (value === undefined || Math.abs(parsed - value) > 0.001) {
        onSave(parsed);
      }
    }
  };

  const printableText = value !== undefined && !Number.isNaN(value) ? value.toFixed(2) : '-';

  if (disabled) {
    return (
      <span className="text-slate-400 font-semibold cursor-not-allowed" title={title}>
        {printableText}
      </span>
    );
  }

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder={placeholder}
        onFocus={(e) => {
          const inputEl = e.currentTarget;
          isFocusedRef.current = true;
          justFocusedRef.current = true;
          if (value !== undefined && !Number.isNaN(value)) {
            setDraft(String(Number(value.toFixed(2))));
          }
          inputEl.select();
          requestAnimationFrame(() => {
            if (document.activeElement === inputEl) {
              inputEl.select();
            }
          });
        }}
        onMouseUp={(e) => {
          if (justFocusedRef.current) {
            e.preventDefault();
            justFocusedRef.current = false;
          }
        }}
        onChange={handleChange}
        onBlur={() => {
          isFocusedRef.current = false;
          justFocusedRef.current = false;
          commit(draft);
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
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
            setDraft(formatDisplay(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        title={title}
        aria-label={title}
        className="print:hidden w-12 min-w-[42px] px-0.5 py-0.5 text-center font-bold text-slate-900 bg-emerald-50/70 hover:bg-emerald-100 focus:bg-white border border-emerald-300 focus:border-emerald-600 rounded outline-none text-[10px] transition-colors placeholder:text-slate-400 cursor-text"
      />
      <span className="hidden print:inline font-semibold text-slate-800">{printableText}</span>
    </>
  );
};
