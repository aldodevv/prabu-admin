import React from 'react';
import { CyanHeaderBar } from './CyanHeaderBar';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

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
  onItemsPerPageChange?: (perPage: number) => void;
  // Custom styles
  className?: string;
}

function getPageNumbers(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (current > 3) {
    pages.push('...');
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push('...');
  }
  pages.push(total);
  return pages;
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
  itemsPerPage = 50,
  onPageChange,
  onItemsPerPageChange,
  className = ''
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const isClientPaginated = data.length > itemsPerPage;
  const displayData = isClientPaginated
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;

  return (
    <div className={`bg-white border border-slate-200 rounded shadow-sm overflow-hidden w-full max-w-full ${className}`}>
      {title && (
        <CyanHeaderBar title={title} action={headerAction} />
      )}
      
      <div className="p-3 sm:p-6">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-650 border-collapse min-w-[600px]">
            <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={col.key} 
                    className={`py-3 px-3 sm:px-4 ${
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
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold select-none uppercase tracking-widest text-xs">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayData.map((item, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      {columns.map((col, idx) => (
                        <td 
                          key={col.key} 
                          className={`py-3 sm:py-3.5 px-3 sm:px-4 ${
                            idx < columns.length - 1 ? 'border-r border-slate-100' : ''
                          } ${
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                          } ${col.className || ''}`}
                        >
                          {col.render ? col.render(item, globalIndex) : (item as any)[col.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rich Numbered Pagination Controls */}
        {!loading && onPageChange && (
          <div className="mt-4 sm:mt-6 flex flex-col md:flex-row gap-3 justify-between items-center text-xs font-accent text-slate-600 font-bold no-print select-none border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
              <span>
                MENAMPILKAN <strong className="text-slate-900">{startItem} - {endItem}</strong> DARI <strong className="text-slate-900">{totalItems.toLocaleString('id-ID')}</strong> DATA
              </span>
              {onItemsPerPageChange && (
                <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Baris:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-800 text-[11px] font-bold cursor-pointer focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                title="Halaman Pertama"
                className="px-2 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
              >
                &laquo;
              </button>

              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Halaman Sebelumnya"
                className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold uppercase"
              >
                &lsaquo; Prev
              </button>

              {pageNumbers.map((p, idx) => {
                if (typeof p === 'string') {
                  return (
                    <span key={idx} className="px-2 py-1 text-slate-400 text-[11px] font-bold">
                      ...
                    </span>
                  );
                }
                const isActive = p === currentPage;
                return (
                  <button
                    key={idx}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 border rounded text-[11px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                title="Halaman Selanjutnya"
                className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold uppercase"
              >
                Next &rsaquo;
              </button>

              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages}
                title="Halaman Terakhir"
                className="px-2 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
