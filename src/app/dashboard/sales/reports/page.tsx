'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FileText, Printer, ArrowLeft, Building2, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';

interface SalesReportItem {
  transaction_date: string;
  transaction_number: string;
  product_name: string;
  payment_method: string;
  invoice_debit: string;
  quantity: number;
  harga_produk: number;
  discount_percent: number;
  total: number;
  harga_beli: number;
  keuntungan: number;
  dilayani_oleh: string;
}

export default function LaporanPenjualanPage() {
  const { activeBranchID, branches, user } = useAuth();
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<SalesReportItem[] | null>(null);
  
  // Track filters used to generate the report
  const [generatedFilters, setGeneratedFilters] = useState({
    dateFrom: '',
    dateTo: '',
  });

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom || !dateTo) {
      alert('Silakan pilih tanggal awal dan tanggal akhir filter.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get<any>(
        `/admin/transactions/report?branch_id=${activeBranchID}&date_from=${dateFrom}&date_to=${dateTo}`
      );
      if (res.success && res.data) {
        setReportData(res.data);
        setGeneratedFilters({ dateFrom, dateTo });
      } else {
        setError(res.error || 'Gagal menghasilkan laporan penjualan.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setReportData(null);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const headers = ['No', 'Tanggal', 'No. Invoice', 'Nama Produk', 'Jenis Transaksi', 'Invoice Debit', 'Qty', 'Harga Produk (IDR)', 'Diskon (%)', 'Total (IDR)', 'Harga Beli (IDR)', 'Keuntungan (IDR)', 'Dilayani Oleh'];
    const data = reportData.map((item, index) => [
      index + 1,
      formatDateLabel(item.transaction_date),
      formatInvoiceNumber(item.transaction_number),
      item.product_name,
      item.payment_method,
      item.invoice_debit || '-',
      item.quantity,
      item.harga_produk,
      item.discount_percent || 0,
      item.total,
      item.harga_beli,
      item.keuntungan,
      item.dilayani_oleh || '-',
    ]);

    exportToExcel({
      filename: `Laporan_Penjualan_${generatedFilters.dateFrom}_sd_${generatedFilters.dateTo}`,
      title: `LAPORAN PENJUALAN (${formatDateLabel(generatedFilters.dateFrom)} s/d ${formatDateLabel(generatedFilters.dateTo)}) - PRABU GYM`,
      headers,
      data,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const activeBranch = branches.find((b) => b.id === activeBranchID);
  const activeBranchName = activeBranch ? activeBranch.name : 'Prabu Gym';
  const activeBranchCode = activeBranch ? activeBranch.code : 'LIMO';

  const formatInvoiceNumber = (txNumber: string) => {
    if (!txNumber) return '';
    // Convert TRX-LIMO-20260722-0001 format to PRABU.LMO.260722.001
    const parts = txNumber.split('-');
    if (parts.length >= 4) {
      const branchCode = parts[1];
      const datePart = parts[2]; // YYYYMMDD
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

  // Calculations for summary card
  const totalPemasukan = reportData ? reportData.reduce((sum, item) => sum + item.total, 0) : 0;
  const totalHargaBeli = reportData ? reportData.reduce((sum, item) => sum + item.harga_beli, 0) : 0;
  const totalKeuntungan = reportData ? reportData.reduce((sum, item) => sum + item.keuntungan, 0) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #sales-report-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area-wrapper {
            display: block !important;
            width: 100% !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
        }
      `}</style>

      {/* Header Breadcrumbs */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg flex items-center justify-between no-print">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Transaksi Penjualan</span>
          <span>&gt;</span>
          <span>Laporan Penjualan</span>
          {reportData && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Daftar Laporan Penjualan</span>
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

      {/* 1. Filter View */}
      {!reportData && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden no-print">
          <div className="bg-[#17A2B8] px-6 py-4 text-white font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Laporan Penjualan</span>
          </div>

          <div className="p-6">
            <form onSubmit={handleGenerateReport} className="max-w-md space-y-4">
              <div>
                <label className="block text-slate-650 text-xs font-semibold mb-1.5">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10"
                />
              </div>

              <div>
                <label className="block text-slate-655 text-xs font-semibold mb-1.5">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs focus:outline-none focus:border-[#17A2B8] rounded h-10"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#1abc9c] hover:bg-[#16a085] text-white font-accent font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {loading ? 'Memproses...' : 'Cetak Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Report Table View */}
      {reportData && (
        <div className="space-y-6 no-print">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-6 py-4 text-white font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">Daftar Laporan Penjualan</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Action row */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#107C41] hover:bg-[#0b5c30] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Laporan
                  </button>
                </div>
              </div>

              {/* Summary Information Block */}
              <div className="border border-slate-200 rounded overflow-hidden max-w-2xl bg-slate-50/50">
                <table className="w-full text-xs text-slate-700">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold w-1/3 select-none">Tanggal Transaksi</td>
                      <td className="py-2.5 px-4 text-slate-800 font-bold">
                        {formatDateLabel(generatedFilters.dateFrom)} s/d {formatDateLabel(generatedFilters.dateTo)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold select-none">Total Pemasukan Penjualan</td>
                      <td className="py-2.5 px-4 text-slate-800 font-extrabold text-sm">
                        Rp {totalPemasukan.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold select-none">Total Harga Beli</td>
                      <td className="py-2.5 px-4 text-slate-800 font-bold">
                        Rp {totalHargaBeli.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold select-none">Total Keuntungan</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-extrabold text-sm">
                        Rp {totalKeuntungan.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold select-none">Nama Petugas</td>
                      <td className="py-2.5 px-4 text-slate-800 font-semibold uppercase">
                        {user?.full_name || 'Kasir Prabu GYM'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Detailed Report Table */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                      <th className="py-2.5 px-3 border-r border-slate-350 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-350">Tanggal Transaksi</th>
                      <th className="py-2.5 px-3 border-r border-slate-350">Nomor Transaksi</th>
                      <th className="py-2.5 px-3 border-r border-slate-350">Nama Produk</th>
                      <th className="py-2.5 px-3 border-r border-slate-350">Jenis Pembayaran</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 w-24 text-center">Invoice Debit</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 w-14 text-center">Jumlah</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 text-right">Harga Produk</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 w-16 text-center">Diskon</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 text-right">Total</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 text-right">Harga Beli</th>
                      <th className="py-2.5 px-3 border-r border-slate-350 text-right">Keuntungan</th>
                      <th className="py-2.5 px-3">Dilayani Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reportData.length > 0 ? (
                      reportData.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">
                            {formatDateLabel(item.transaction_date)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[10px]">
                            {formatInvoiceNumber(item.transaction_number)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-semibold">{item.product_name}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 uppercase text-[10px]">
                            {item.payment_method}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono">
                            {item.invoice_debit || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono">{item.quantity}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-right">
                            {item.harga_produk.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-500">
                            {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-900 text-right">
                            {item.total.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-right text-slate-600">
                            {item.harga_beli.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-emerald-600 text-right">
                            {item.keuntungan.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] uppercase font-bold text-slate-500">
                            {item.dilayani_oleh}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={13} className="py-10 text-center text-slate-400 font-semibold italic">
                          Tidak ada data transaksi ditemukan pada periode tanggal ini.
                        </td>
                      </tr>
                    )}
                    {/* Grand Total Row */}
                    <tr className="bg-slate-50 font-black border-t border-slate-200">
                      <td colSpan={9} className="py-3 px-4 text-slate-800 text-right uppercase tracking-widest text-[9px] border-r border-slate-200 select-none">
                        Grand Total
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 font-mono text-right text-[#DC3545] font-black text-sm">
                        Rp {totalPemasukan.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 font-mono text-right text-slate-700">
                        Rp {totalHargaBeli.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 font-mono text-right text-emerald-600 font-black text-sm">
                        Rp {totalKeuntungan.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Printable B&W Layout Container (Shown only on print) */}
      {reportData && (
        <div className="hidden print:block print-area-wrapper">
          <div className="p-4 space-y-6 text-black">
            {/* Header Box */}
            <div className="border border-black p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Crown shape inline SVG representing Prabu Gym logo */}
                <svg className="w-12 h-12 text-black" viewBox="0 0 500 240" fill="currentColor">
                  <path d="M170 55 L200 85 L250 45 L300 85 L330 55 L320 100 L180 100 Z" />
                  <rect x="70" y="110" width="15" height="50" rx="4" />
                  <rect x="90" y="100" width="15" height="70" rx="4" />
                  <rect x="110" y="90" width="18" height="90" rx="6" />
                  <rect x="128" y="130" width="244" height="10" />
                  <rect x="372" y="90" width="18" height="90" rx="6" />
                  <rect x="395" y="100" width="15" height="70" rx="4" />
                  <rect x="415" y="110" width="15" height="50" rx="4" />
                  <path d="M210 145 C210 120, 290 120, 290 145 C290 160, 210 160, 210 145 Z" />
                </svg>
                <div className="text-left leading-none">
                  <h1 className="text-xl font-black tracking-widest">PRABU</h1>
                  <span className="text-[8px] uppercase font-bold text-slate-500">Gym & Fitness Center</span>
                </div>
              </div>
              
              <div className="text-right border-l border-black pl-8 pr-4">
                <h2 className="text-2xl font-black uppercase tracking-widest text-black">
                  PRABU SALES REPORT
                </h2>
              </div>
            </div>

            {/* Summary Details */}
            <div className="border border-black overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="py-2 px-3 font-bold bg-slate-50 border-r border-black w-1/3">Tanggal Transaksi</td>
                    <td className="py-2 px-3 font-mono">{formatDateLabel(generatedFilters.dateFrom)} s/d {formatDateLabel(generatedFilters.dateTo)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-2 px-3 font-bold bg-slate-50 border-r border-black">Total Pemasukan Penjualan</td>
                    <td className="py-2 px-3 font-mono font-bold">Rp {totalPemasukan.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-2 px-3 font-bold bg-slate-50 border-r border-black">Total Harga Beli</td>
                    <td className="py-2 px-3 font-mono font-bold">Rp {totalHargaBeli.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-2 px-3 font-bold bg-slate-50 border-r border-black">Total Keuntungan</td>
                    <td className="py-2 px-3 font-mono font-bold">Rp {totalKeuntungan.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold bg-slate-50 border-r border-black">Nama Petugas</td>
                    <td className="py-2 px-3 font-semibold uppercase">{user?.full_name || 'Kasir'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main items table */}
            <div className="border border-black overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase text-[8px]">
                    <th className="py-2 px-1.5 border-r border-black text-center w-8">No</th>
                    <th className="py-2 px-1.5 border-r border-black">Tanggal</th>
                    <th className="py-2 px-1.5 border-r border-black">Invoice</th>
                    <th className="py-2 px-1.5 border-r border-black">Produk</th>
                    <th className="py-2 px-1.5 border-r border-black text-center">Bayar</th>
                    <th className="py-2 px-1.5 border-r border-black text-center">Qty</th>
                    <th className="py-2 px-1.5 border-r border-black text-right">Harga</th>
                    <th className="py-2 px-1.5 border-r border-black text-center">Disc</th>
                    <th className="py-2 px-1.5 border-r border-black text-right">Total</th>
                    <th className="py-2 px-1.5 border-r border-black text-right">Beli</th>
                    <th className="py-2 px-1.5 border-r border-black text-right">Untung</th>
                    <th className="py-2 px-1.5">Dilayani</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="border-b border-black last:border-0">
                      <td className="py-1.5 px-1 border-r border-black text-center">{idx + 1}</td>
                      <td className="py-1.5 px-1 border-r border-black whitespace-nowrap">{formatDateLabel(item.transaction_date)}</td>
                      <td className="py-1.5 px-1 border-r border-black font-mono">{formatInvoiceNumber(item.transaction_number)}</td>
                      <td className="py-1.5 px-1 border-r border-black font-bold">{item.product_name}</td>
                      <td className="py-1.5 px-1 border-r border-black text-center uppercase">{item.payment_method}</td>
                      <td className="py-1.5 px-1 border-r border-black text-center">{item.quantity}</td>
                      <td className="py-1.5 px-1 border-r border-black text-right">{item.harga_produk.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-1 border-r border-black text-center">{item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</td>
                      <td className="py-1.5 px-1 border-r border-black text-right font-bold">{item.total.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-1 border-r border-black text-right">{item.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-1 border-r border-black text-right font-bold">{item.keuntungan.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-1 uppercase whitespace-nowrap">{item.dilayani_oleh.split(' ')[0]}</td>
                    </tr>
                  ))}
                  {/* Grand total print row */}
                  <tr className="bg-slate-50 font-bold border-t border-black">
                    <td colSpan={8} className="py-2 px-3 border-r border-black text-right uppercase tracking-wider text-[8px]">Grand Total</td>
                    <td className="py-2 px-1 border-r border-black text-right font-bold">{totalPemasukan.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-1 border-r border-black text-right">{totalHargaBeli.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-1 border-r border-black text-right font-bold">{totalKeuntungan.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
