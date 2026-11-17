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
    // Autoriser chiffres, point/virgule décimaux uniquement pendant la saisie
    if (raw !== '' && !/^\d{0,2}(?:[.,]\d{0,2})?$/.test(raw)) {
      return;
    }
    setDraft(raw);

    // Si l'utilisateur ne termine pas par '.' ou ',', appliquer en direct pour recalcul immédiat
    if (raw.trim() === '') {
      return;
    }
    if (!raw.endsWith('.') && !raw.endsWith(',')) {
      const parsed = parseNormalized(raw);
      if (parsed !== null && !Number.isNaN(parsed)) {
        if (value === undefined || Math.abs(parsed - value) > 0.001) {
          onSave(parsed);
        }
      }
    }
  };

  const printableText = value !== undefined && !Number.isNaN(value) ? value.toFixed(2) : '-';

  if (disabled) {
    return (
      <span className="text-slate-400 font-semibold" title={title}>
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
          isFocusedRef.current = true;
          if (value !== undefined && !Number.isNaN(value)) {
            // Afficher sans zéros inutiles pendant l'édition (ex: 14.50 -> 14.5, 14.00 -> 14)
            setDraft(String(Number(value.toFixed(2))));
          }
          e.target.select();
        }}
        onChange={handleChange}
        onBlur={() => {
          isFocusedRef.current = false;
          commit(draft);
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            isFocusedRef.current = false;
            commit(draft);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            isFocusedRef.current = false;
            setDraft(formatDisplay(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        title={title}
        aria-label={title}
        className="print:hidden w-11 px-0.5 py-0.5 text-center font-bold text-slate-900 bg-emerald-50/60 hover:bg-emerald-100/80 focus:bg-white border border-emerald-200 focus:border-emerald-600 rounded outline-none text-[10px] transition-colors placeholder:text-slate-400"
      />
      <span className="hidden print:inline font-semibold text-slate-800">{printableText}</span>
    </>
  );
};
