import React from 'react';
import { Search, FileSpreadsheet, RotateCcw, Filter } from 'lucide-react';

export interface ColumnOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  searchPlaceholder?: string;
  columnOptions?: ColumnOption[];
  selectedColumn?: string;
  onColumnChange?: (col: string) => void;
  isTyping?: boolean;
  onExportExcel?: () => void;
  onReset?: () => void;
  children?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Cari data...',
  columnOptions,
  selectedColumn,
  onColumnChange,
  isTyping = false,
  onExportExcel,
  onReset,
  children
}) => {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded shadow-sm flex items-end justify-between gap-4 flex-wrap no-print">
      <div className="flex flex-wrap gap-3 items-end flex-1">
        {/* Column Filter Selector */}
        {columnOptions && columnOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#17A2B8]" /> Filter Kolom
            </label>
            <select
              value={selectedColumn || ''}
              onChange={(e) => onColumnChange?.(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded font-medium"
            >
              <option value="">- Semua Kolom -</option>
              {columnOptions.map((col) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input with Typing Detector */}
        {searchQuery !== undefined && (
          <div className="flex flex-col gap-1 flex-1 max-w-md">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-bold text-slate-500 uppercase tracking-wider">Pencarian</label>
              {isTyping && (
                <span className="text-[#17A2B8] font-bold tracking-wider animate-pulse text-[10px]">
                  ✍️ Sedang mengetik...
                </span>
              )}
            </div>
            {onSearchSubmit ? (
              <form onSubmit={onSearchSubmit} className="flex gap-2 items-center w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery || ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 pl-10 text-xs rounded transition-all font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  Pencarian
                </button>
              </form>
            ) : (
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 pl-10 text-xs rounded transition-all font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>
        )}

        {children}
      </div>

      {/* Control Buttons (Export Excel & Reset Data) */}
      <div className="flex items-center gap-2 flex-wrap">
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            title="Export data ke format Microsoft Excel (.xlsx)"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset filter dan kembali ke data default"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Data</span>
          </button>
        )}
      </div>
    </div>
  );
};
