import React from 'react';
import { CyanHeaderBar } from './CyanHeaderBar';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  headerAction?: React.ReactNode;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  // Pagination
  currentPage?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  // Custom styles
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  title,
  headerAction,
  columns,
  data,
  loading = false,
  loadingMessage = 'Memuat data...',
  emptyMessage = 'Tidak ada data ditemukan.',
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  className = ''
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className={`bg-white border border-slate-200 rounded shadow-sm overflow-hidden ${className}`}>
      {title && (
        <CyanHeaderBar title={title} action={headerAction} />
      )}
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-650 border-collapse">
            <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={col.key} 
                    className={`py-3 px-4 ${
                      idx < columns.length - 1 ? 'border-r border-slate-350/40' : ''
                    } ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold select-none uppercase tracking-wider text-xs">
                    <div className="inline-block w-4 h-4 border-2 border-slate-200 border-t-[#007BFF] rounded-full animate-spin mr-2" />
                    {loadingMessage}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold select-none uppercase tracking-widest text-xs">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col, idx) => (
                      <td 
                        key={col.key} 
                        className={`py-3.5 px-4 ${
                          idx < columns.length - 1 ? 'border-r border-slate-100' : ''
                        } ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(item, index) : (item as any)[col.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && onPageChange && totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center text-xs font-accent text-slate-500 font-bold no-print select-none border-t border-slate-100 pt-4">
            <div>
              MENAMPILKAN {data.length} DARI {totalItems} DATA
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-55 rounded disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed uppercase text-[10px]"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-55 rounded disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed uppercase text-[10px]"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
