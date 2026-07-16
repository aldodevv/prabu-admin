import React from 'react';
import { Search } from 'lucide-react';

interface SearchFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  searchPlaceholder?: string;
  onReset?: () => void;
  children?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Cari...',
  onReset,
  children
}) => {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded shadow-sm flex items-end justify-between gap-4 flex-wrap no-print">
      <div className="flex flex-wrap gap-4 items-end flex-1">
        {onSearchSubmit ? (
          <form onSubmit={onSearchSubmit} className="flex gap-2 items-end flex-1 max-w-sm">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3.5 py-2.5 pl-10 text-xs transition-all rounded"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer shadow-sm flex-shrink-0"
            >
              CARI
            </button>
          </form>
        ) : searchQuery !== undefined ? (
          <div className="relative max-w-sm flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3.5 py-2.5 pl-10 text-xs transition-all rounded"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        ) : null}

        {children}
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-accent text-xs uppercase tracking-widest transition-all rounded cursor-pointer font-bold"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
};
