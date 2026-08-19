import React from 'react';

export interface Option<T> {
  value: T;
  label: string;
  hint?: string;
  emoji?: string;
}

interface OptionGroupProps<T> {
  label?: string;
  options: Option<T>[];
  value: T | T[];
  onChange: (value: T) => void;
  /** Permite varias selecciones activas a la vez */
  multiple?: boolean;
  columns?: 2 | 3 | 4;
  disabled?: boolean;
  accent?: 'indigo' | 'pink' | 'emerald' | 'amber';
}

const ACCENTS: Record<string, string> = {
  indigo: 'bg-indigo-600 border-indigo-400 text-white',
  pink: 'bg-pink-600 border-pink-400 text-white',
  emerald: 'bg-emerald-600 border-emerald-400 text-white',
  amber: 'bg-amber-500 border-amber-300 text-slate-950'
};

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4'
};

/**
 * Grupo de opciones tipo "segmented control".
 * Se adapta de 2 columnas en pantallas angostas al número pedido en anchas,
 * y admite selección simple o múltiple.
 */
export function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  columns = 3,
  disabled = false,
  accent = 'indigo'
}: OptionGroupProps<T>) {
  const selected = Array.isArray(value) ? value : [value];

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        className={`grid ${COLUMNS[columns]} gap-2`}
        role={multiple ? 'group' : 'radiogroup'}
        aria-label={label}
      >
        {options.map((option) => {
          const isActive = selected.includes(option.value);

          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={isActive}
              className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive
                  ? `${ACCENTS[accent]} shadow-lg`
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {option.emoji && <span aria-hidden="true">{option.emoji}</span>}
                <span className="truncate">{option.label}</span>
              </span>
              {option.hint && (
                <span
                  className={`block text-[11px] font-medium mt-0.5 leading-tight ${
                    isActive ? 'text-white/75' : 'text-slate-500'
                  }`}
                >
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selector numérico con botones -/+ para cantidades libres (equipos, jugadores) */
export const NumberStepper: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint?: string;
  disabled?: boolean;
}> = ({ label, value, min, max, onChange, hint, disabled = false }) => {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          aria-label={`Menos ${label}`}
          className="btn-ghost w-11 h-11 text-2xl font-black flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          −
        </button>

        <div className="flex-1 text-center bg-slate-900 border border-slate-700 rounded-xl py-2.5">
          <span className="font-mono text-2xl font-black text-white">{value}</span>
        </div>

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= max}
          aria-label={`Más ${label}`}
          className="btn-ghost w-11 h-11 text-2xl font-black flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          +
        </button>
      </div>

      {hint && <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>}
    </div>
  );
};
