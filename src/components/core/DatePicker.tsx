'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
  disabled = false,
  readOnly = false,
  required = false,
  className = '',
  minYear = 1950,
  maxYear = 2050
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view date
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Sync view date when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside listener to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date display (e.g. 24 Jul 2026)
  const formatDisplay = (val: string) => {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    const day = d.getDate().toString().padStart(2, '0');
    const month = MONTH_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    if (disabled || readOnly) return;
    const formattedMonth = (viewMonth + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const selectedIso = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange?.(selectedIso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (disabled || readOnly) return;
    const today = new Date();
    const formattedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = today.getDate().toString().padStart(2, '0');
    const todayIso = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange?.(todayIso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || readOnly) return;
    onChange?.('');
  };

  // Build year options
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full text-slate-800 font-sans">
      {/* Input Trigger Button */}
      <div
        onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded cursor-pointer select-none transition-all ${
          isOpen ? 'ring-2 ring-[#17A2B8] border-[#17A2B8] bg-white' : 'hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''} ${readOnly ? 'bg-slate-100 cursor-default' : ''} ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-xs">
          <CalendarIcon className="w-4 h-4 text-[#17A2B8] shrink-0" />
          <span className={`truncate font-mono ${value ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !readOnly && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover Calendar Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 animate-fadeIn select-none">
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Dropdowns */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-1.5 py-1 rounded text-xs focus:outline-none cursor-pointer hover:bg-slate-100"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-1.5 py-1 rounded text-xs focus:outline-none cursor-pointer hover:bg-slate-100 font-mono"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center text-[10px] font-black uppercase text-slate-400">
            {DAY_NAMES.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Day buttons */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg font-mono text-xs transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#17A2B8] text-white font-bold shadow-sm scale-105'
                      : today
                      ? 'border-2 border-[#17A2B8] text-[#17A2B8] font-bold bg-cyan-50/50'
                      : 'hover:bg-slate-100 text-slate-700 font-medium'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#17A2B8] hover:text-[#138496] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hari Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
