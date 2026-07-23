'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FileText, Printer, ArrowLeft, Eye, Search, X, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/lib/excelExport';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';

interface TransactionItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  transaction_number: string;
  member_name?: string;
  admin_name: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  notes?: string;
  items?: TransactionItem[];
}

const BRANCH_ADDRESSES: Record<string, string> = {
  'LIMO': 'Jl. Naman Iskandar No.95\nLimo, Kec. Limo, Kota Depok, Jawa Barat 16515',
  'GROGOL': 'Jl. Raya Grogol No.12\nGrogol, Jakarta Barat, DKI Jakarta 11440',
  'PANCORAN_MAS': 'Jl. Raya Sawangan No.45\nPancoran Mas, Kota Depok, Jawa Barat 16436',
};

export default function TransactionHistoryPage() {
  const { activeBranchID, branches, user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search, Debounce & Column Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [isTyping, setIsTyping] = useState(false);
  const [searchPaymentMethod, setSearchPaymentMethod] = useState('');
  
  // Selected detailed transaction state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    if (activeBranchID) {
      fetchTransactions();
      setSelectedTx(null);
    }
  }, [activeBranchID]);

  // Handle typing state
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchQuery, debouncedSearch]);

  // Apply filtering when debouncedSearch, filterColumn or searchPaymentMethod changes
  useEffect(() => {
    applyFilter();
  }, [debouncedSearch, filterColumn, searchPaymentMethod, transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<any>(`/admin/transactions?branch_id=${activeBranchID}&per_page=200`);
      if (res.success && res.data) {
        setTransactions(res.data);
        setFilteredTransactions(res.data);
      } else {
        setError(res.error || 'Gagal mengambil data riwayat transaksi');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let result = [...transactions];

    if (searchPaymentMethod) {
      result = result.filter((tx) => tx.payment_method === searchPaymentMethod);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((tx) => {
        if (filterColumn === 'transaction_number') return tx.transaction_number.toLowerCase().includes(q);
        if (filterColumn === 'payment_method') return tx.payment_method.toLowerCase().includes(q);
        if (filterColumn === 'admin_name') return (tx.admin_name || '').toLowerCase().includes(q);

        return (
          tx.transaction_number.toLowerCase().includes(q) ||
          (tx.payment_method || '').toLowerCase().includes(q) ||
          (tx.admin_name || '').toLowerCase().includes(q) ||
          (tx.notes || '').toLowerCase().includes(q)
        );
      });
    }

    setFilteredTransactions(result);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilterColumn('');
    setSearchPaymentMethod('');
    setFilteredTransactions(transactions);
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Tanggal Transaksi', 'Nomor Transaksi', 'Jenis Transaksi', 'Total Harga (IDR)', 'Bayar (IDR)', 'Kembali (IDR)', 'Petugas CS'];
    const data = filteredTransactions.map((tx, index) => [
      index + 1,
      formatDateLabel(tx.transaction_date),
      formatInvoiceNumber(tx.transaction_number, tx.transaction_date),
      tx.payment_method || 'Tunai',
      tx.total_amount || 0,
      tx.payment_amount || 0,
      tx.change_amount || 0,
      tx.admin_name || '-',
    ]);

    exportToExcel({
      filename: `Riwayat_Transaksi_Prabu_Gym_${new Date().toISOString().split('T')[0]}`,
      title: 'RIWAYAT TRANSAKSI PENJUALAN - PRABU GYM',
      headers,
      data,
    });
  };

  const columnOptions = [
    { label: 'Nomor Transaksi', value: 'transaction_number' },
    { label: 'Jenis Transaksi', value: 'payment_method' },
    { label: 'Petugas CS', value: 'admin_name' },
  ];

  const handleViewDetail = async (txID: string) => {
    setLoading(true);
    try {
      const res = await api.get<Transaction>(`/admin/transactions/${txID}`);
      if (res.success && res.data) {
        setSelectedTx(res.data);
      } else {
        alert(res.error || 'Gagal memuat rincian transaksi');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal memuat rincian transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTx(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeBranch = branches.find((b) => b.id === activeBranchID);
  const activeBranchName = activeBranch ? activeBranch.name : 'Prabu Gym';
  const activeBranchCode = activeBranch ? activeBranch.code : 'LIMO';
  const branchAddress = BRANCH_ADDRESSES[activeBranchCode.toUpperCase()] || 'Limo, Depok';

  const formatInvoiceNumber = (txNumber: string, txDate?: string) => {
    if (!txNumber) return '';
    // Format: PRABU.LMO.220726.002
    const parts = txNumber.split('-');
    if (parts.length >= 4) {
      const branchCode = parts[1];
      const datePart = parts[2];
      const seq = parts[3];
      
      const codeMap: Record<string, string> = {
        'LIMO': 'LMO',
        'GROGOL': 'GGL',
        'PANCORAN_MAS': 'PMS'
      };
      const bCode = codeMap[branchCode.toUpperCase()] || 'LMO';
      const yy = datePart.substring(2, 4);
      const mm = datePart.substring(4, 6);
      const dd = datePart.substring(6, 8);
      const shortSeq = String(Number(seq)).padStart(3, '0');
      
      return `PRABU.${bCode}.${yy}${mm}${dd}.${shortSeq}`;
    }
    return txNumber;
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #receipt-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 80mm !important;
            margin: 0 auto !important;
            font-family: monospace !important;
          }
        }
      `}</style>

      {/* Header Breadcrumbs */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg flex items-center justify-between no-print">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Riwayat Transaksi</span>
          {selectedTx && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Lihat Detail</span>
            </>
          )}
        </div>
        
        {/* Dynamic Branch Tag */}
        {activeBranch && (
          <div className="px-3.5 py-1.5 border border-red-500 text-red-500 font-extrabold text-xs rounded-full uppercase tracking-wider bg-red-50/50 select-none">
            Club {activeBranchName.replace('Prabu Gym ', '')}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded shadow-sm no-print">
          ⚠️ {error}
        </div>
      )}

      {/* 1. MAIN LIST VIEW */}
      {!selectedTx && (
        <div className="space-y-6 no-print">
          {/* Reusable Search & Filter Bar with Export Excel */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Ketik nomor transaksi, petugas CS..."
            columnOptions={columnOptions}
            selectedColumn={filterColumn}
            onColumnChange={setFilterColumn}
            isTyping={isTyping}
            onExportExcel={handleExportExcel}
            onReset={handleClearSearch}
          >
            <select
              value={searchPaymentMethod}
              onChange={(e) => setSearchPaymentMethod(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded font-medium cursor-pointer"
            >
              <option value="">Metode Pembayaran: Semua</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="QRIS">QRIS</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </SearchFilterBar>

          {/* Card: Riwayat Transaksi */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-6 py-4 text-white font-bold">
              <span className="text-sm uppercase tracking-wider">Riwayat Transaksi</span>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-10 text-slate-500 font-accent uppercase tracking-widest text-xs">
                  Loading riwayat transaksi...
                </div>
              ) : (
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                        <th className="py-2.5 px-4 border-r border-slate-350 w-12 text-center">No</th>
                        <th className="py-2.5 px-4 border-r border-slate-350">Tanggal Transaksi</th>
                        <th className="py-2.5 px-4 border-r border-slate-350">Nomor Transaksi</th>
                        <th className="py-2.5 px-4 border-r border-slate-350">Jenis Transaksi</th>
                        <th className="py-2.5 px-4 border-r border-slate-350 text-right">Total Harga</th>
                        <th className="py-2.5 px-4 border-r border-slate-350 text-right">Bayar</th>
                        <th className="py-2.5 px-4 border-r border-slate-350">Petugas</th>
                        <th className="py-2.5 px-4 w-20 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx, idx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-4 text-center border-r border-slate-100 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-4 border-r border-slate-100 font-mono">
                              {formatDateLabel(tx.transaction_date)}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-100 font-mono font-bold text-slate-900">
                              {formatInvoiceNumber(tx.transaction_number, tx.transaction_date)}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-100 font-semibold">
                              {tx.payment_method || 'Tunai'}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-100">
                              <div className="flex justify-between font-mono font-bold text-slate-900">
                                <span>Rp</span>
                                <span>{tx.total_amount.toLocaleString('id-ID')}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-100">
                              <div className="flex justify-between font-mono text-slate-700">
                                <span>Rp</span>
                                <span>{tx.payment_amount.toLocaleString('id-ID')}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-650 uppercase">
                              {tx.admin_name}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {/* Icon-Only Action Button with Tooltip */}
                              <button
                                onClick={() => handleViewDetail(tx.id)}
                                title="Lihat Detail Transaksi"
                                className="p-2 bg-[#6C7A89] hover:bg-[#5a6673] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105 mx-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold italic text-sm">
                            Tidak ada data transaksi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DETAIL VIEW */}
      {selectedTx && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden no-print">
          <div className="bg-[#17A2B8] px-6 py-4 text-white font-bold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Lihat Detail</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#1abc9c] hover:bg-[#16a085] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Transaksi
              </button>
            </div>

            {/* Key-Value Details */}
            <div className="border border-slate-200 rounded overflow-hidden max-w-3xl">
              <table className="w-full text-xs text-slate-700">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold w-1/3 select-none">Nomor Transaksi</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800 flex items-center gap-2">
                      <span>=</span>
                      <span>{formatInvoiceNumber(selectedTx.transaction_number, selectedTx.transaction_date)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Jenis Transaksi</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold flex items-center gap-2">
                      <span>=</span>
                      <span>{selectedTx.payment_method}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Total Bayar</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold flex items-center gap-2 font-mono">
                      <span>=</span>
                      <span>{selectedTx.total_amount.toLocaleString('id-ID')}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Bayar</td>
                    <td className="py-2.5 px-4 text-slate-850 font-bold flex items-center gap-2 font-mono">
                      <span>=</span>
                      <span>{selectedTx.payment_amount.toLocaleString('id-ID')}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Kembalian</td>
                    <td className="py-2.5 px-4 text-slate-850 font-bold flex items-center gap-2 font-mono">
                      <span>=</span>
                      <span>{selectedTx.change_amount.toLocaleString('id-ID')}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Tanggal Transaksi</td>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-2 font-mono">
                      <span>=</span>
                      <span>{formatDateLabel(selectedTx.transaction_date)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold select-none">Nama Petugas</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold uppercase flex items-center gap-2">
                      <span>=</span>
                      <span>{selectedTx.admin_name}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                      <th className="py-2.5 px-4 border-r border-slate-350 w-12 text-center">No</th>
                      <th className="py-2.5 px-4 border-r border-slate-350">Nama Barang</th>
                      <th className="py-2.5 px-4 border-r border-slate-350 w-24 text-center">Unit</th>
                      <th className="py-2.5 px-4 border-r border-slate-350 text-right">Harga Barang</th>
                      <th className="py-2.5 px-4 border-r border-slate-350 w-24 text-center">Diskon</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedTx.items && selectedTx.items.length > 0 ? (
                      selectedTx.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4 text-center border-r border-slate-100 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-4 border-r border-slate-100 font-semibold">{item.product_name}</td>
                          <td className="py-2.5 px-4 text-center border-r border-slate-100 font-mono">{item.quantity}</td>
                          <td className="py-2.5 px-4 border-r border-slate-100">
                            <div className="flex justify-between font-mono">
                              <span>Rp</span>
                              <span>{item.unit_price.toLocaleString('id-ID')}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center border-r border-slate-100 font-semibold text-slate-500">
                            {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex justify-between font-mono font-bold text-slate-900">
                              <span>Rp</span>
                              <span>{item.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold italic text-xs">
                          Tidak ada rincian produk (Pendaftaran/pembayaran membership langsung).
                        </td>
                      </tr>
                    )}
                    {/* Grand Total Row */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={5} className="py-3 px-4 text-slate-800 text-right uppercase tracking-wider text-[10px] border-r border-slate-200 select-none">
                        Grand Total
                      </td>
                      <td>
                        <div className="flex justify-between font-mono text-[#DC3545] font-extrabold text-sm px-4">
                          <span>Rp</span>
                          <span>{selectedTx.total_amount.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print container containing ONLY the thermal receipt */}
      {selectedTx && (
        <div className="hidden print:block print-container">
          <div className="text-black font-mono text-[10px] leading-relaxed mx-auto w-full">
            {/* Logo section */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 mb-2">
              <img
                src="/logo-transparent.png"
                alt="Prabu Gym Logo"
                className="h-10 w-auto object-contain mb-1"
              />
              <div className="text-[8px] text-center font-bold whitespace-pre-line leading-tight">
                {branchAddress}
              </div>
            </div>

            {/* Invoice details */}
            <div className="space-y-0.5 border-t border-dashed border-black pt-1 mb-1.5 text-[9px]">
              <div className="flex justify-between">
                <span>Struk: {formatInvoiceNumber(selectedTx.transaction_number, selectedTx.transaction_date)}</span>
                <span>{new Date(selectedTx.transaction_date).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {selectedTx.admin_name}</span>
                <span>Pembayaran: {selectedTx.payment_method}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1" />

            {/* Items */}
            <div className="space-y-1.5 text-[9px]">
              {selectedTx.items?.map((item: any, idx: number) => {
                const itemPrice = item.unit_price || 0;
                const itemDiscount = item.discount_percent || 0;
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold">{item.product_name}</div>
                    <div className="flex justify-between pl-2">
                      <span>
                        {item.quantity} x {itemPrice.toLocaleString('id-ID')}
                        {itemDiscount > 0 ? ` (Disc ${itemDiscount}%)` : ''}
                      </span>
                      <span>{item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1.5" />

            {/* Summary */}
            <div className="text-[9px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span>{selectedTx.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar</span>
                <span>{selectedTx.payment_amount.toLocaleString('id-ID')}</span>
              </div>
              {selectedTx.payment_method === 'Tunai' && (
                <div className="flex justify-between font-bold">
                  <span>Kembalian</span>
                  <span>{selectedTx.change_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center text-[8px] font-bold uppercase tracking-wider">
              Thank you for your visit
            </div>
            <div className="border-t border-dashed border-black my-1" />
          </div>
        </div>
      )}
    </div>
  );
}
