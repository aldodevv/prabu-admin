'use client';

import React from 'react';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | undefined | null;
  onChangeValue: (numericValue: number, rawDigits: string) => void;
  prefix?: string;
  allowZero?: boolean;
  wrapperClassName?: string;
}

/**
 * Format string digits into Indonesian locale with thousand separators (e.g. 150000 -> 150.000)
 */
export function formatCurrencyDigits(digits: string | number | undefined | null, allowZero = false): string {
  if (digits === undefined || digits === null || digits === '') return '';
  const num = typeof digits === 'number' ? digits : Number(String(digits).replace(/\D/g, ''));
  if (isNaN(num)) return '';
  if (num === 0 && !allowZero) return '';
  return num.toLocaleString('id-ID');
}

/**
 * CurrencyInput
 * - Type 'text' with inputMode 'numeric'
 * - Filters strictly non-numeric characters using regex
 * - Auto thousand separator dots (e.g. 150.000)
 * - Defaults to empty string (never forced to 0)
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChangeValue,
  prefix = 'Rp',
  allowZero = false,
  placeholder = '0',
  className,
  wrapperClassName = '',
  disabled,
  readOnly,
  ...rest
}) => {
  // Format the display value
  const displayValue = formatCurrencyDigits(value, allowZero);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const numericValue = rawDigits ? Number(rawDigits) : 0;
    onChangeValue(numericValue, rawDigits);
  };

  return (
    <div className={`relative flex items-center w-full ${wrapperClassName}`}>
      {prefix && (
        <span
          className={`absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-xs font-bold select-none rounded-l border-y border-l transition-colors ${
            disabled
              ? 'bg-slate-150 text-slate-400 border-slate-300'
              : 'bg-slate-100 text-slate-500 border-slate-300'
          }`}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full bg-slate-50 border border-slate-300 focus:outline-none focus:border-brand-cyan text-slate-800 text-xs transition-colors rounded ${
          prefix ? 'pl-11 pr-3 py-2.5' : 'px-3 py-2.5'
        } ${className || ''}`}
        {...rest}
      />
    </div>
  );
};

export default CurrencyInput;
