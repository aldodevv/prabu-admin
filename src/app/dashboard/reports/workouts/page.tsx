'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import { WorkoutRegistrationReportPrintTemplate, OfficialPTReceiptTemplate } from '@/components/core/PrintTemplates';
import { formatDateLabel, formatIDR } from '@/core/constants';
import { Printer, FileText, ArrowLeft } from 'lucide-react';
import { DatePicker } from '@/components/core/DatePicker';

interface PTRegistrationReportItem {
  id: string;
  transaction_number?: string;
  member_id: string;
  member_name: string;
  member_username?: string;
  trainer_id: string;
  trainer_name: string;
  package_name: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  admin_name?: string;
  sessions_count?: number;
}

export default function WorkoutReportsPage() {
  const { activeBranchID, user, loading: authLoading } = useAuth();

  // Navigation Step: 'form' | 'result'
  const [step, setStep] = useState<'form' | 'result'>('form');

  // Form Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('Semua Transaksi');
  const [ppnFormat, setPpnFormat] = useState('Tidak');

  // Data & Status
  const [registrations, setRegistrations] = useState<PTRegistrationReportItem[]>([]);
  const [filteredList, setFilteredList] = useState<PTRegistrationReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<PTRegistrationReportItem | null>(null);

  // Set default dates (Awal bulan s/d hari ini)
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    setStartDate(firstDayStr);
    setEndDate(todayStr);
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBranchID) {
      setError('Silakan pilih cabang terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let url = `/admin/pt-registrations?branch_id=${activeBranchID}&per_page=500`;
      if (startDate) url += `&date_from=${startDate}`;
      if (endDate) url += `&date_to=${endDate}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        let items: PTRegistrationReportItem[] = res.data;

        // Filter by Date Range (client-side safety check)
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          items = items.filter(r => new Date(r.created_at) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          items = items.filter(r => new Date(r.created_at) <= end);
        }

        // Filter by Jenis Transaksi (Payment Method)
        if (transactionType && transactionType !== 'Semua Transaksi' && transactionType !== '-Pilih-') {
          items = items.filter(r => {
            const method = (r.payment_method || '').toLowerCase();
            const target = transactionType.toLowerCase();
            return method.includes(target) || target.includes(method);
          });
        }

        setRegistrations(res.data);
        setFilteredList(items);
        setStep('result');
      } else {
        setError(res.error || 'Gagal memuat data transaksi pendaftaran latihan');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan koneksi server');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = filteredList.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="no-print space-y-6">

        {/* STEP 1: FORM FILTER INPUT (GENERATOR) */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-accent">
              <span>Laporan Fitnes</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Laporan Fitnes Latihan</span>
            </div>

            {error && (
              <FetchErrorAlert error={error} featureName="Laporan Pendaftaran Latihan" onRetry={handleGenerate} />
            )}

            {/* Main Form Card */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
                <FileText className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider font-heading">Laporan Fitnes Latihan</span>
              </div>

              <div className="p-6 md:p-8">
                <form onSubmit={handleGenerate} className="space-y-5 text-sm text-slate-700 max-w-3xl">
                  {/* Dari Tanggal */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-xs font-semibold text-right max-sm:text-left text-slate-600 font-accent uppercase tracking-wider">
                      Dari Tanggal
                    </label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Masukan Tanggal"
                      required
                    />
                  </div>

                  {/* Sampai Tanggal */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-xs font-semibold text-right max-sm:text-left text-slate-600 font-accent uppercase tracking-wider">
                      Sampai Tanggal
                    </label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Masukan Tanggal"
                      required
                    />
                  </div>

                  {/* Jenis Transaksi */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-xs font-semibold text-right max-sm:text-left text-slate-600 font-accent uppercase tracking-wider">
                      Jenis Transaksi
                    </label>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded w-full cursor-pointer font-medium"
                    >
                      <option value="Semua Transaksi">-Pilih-</option>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="BCA Transfer">BCA Transfer</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>

                  {/* Format Laporan PPN */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-xs font-semibold text-right max-sm:text-left text-slate-600 font-accent uppercase tracking-wider">
                      Format Laporan PPN
                    </label>
                    <select
                      value={ppnFormat}
                      onChange={(e) => setPpnFormat(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded w-full cursor-pointer font-medium"
                    >
                      <option value="Tidak">-Pilih-</option>
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya (Dengan Pajak / PPN 10%)</option>
                    </select>
                  </div>

                  {/* Action Button */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1 pt-2">
                    <div />
                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Printer className="w-4 h-4" />
                        <span>{loading ? 'Memuat Data...' : 'Cetak Laporan'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: RESULT TABLE VIEW */}
        {step === 'result' && (
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-accent">
              <span>Laporan Fitnes Latihan</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Daftar Laporan Fitnes Latihan</span>
            </div>

            {/* Main Result Card */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
                <FileText className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider font-heading">Daftar Laporan Fitnes Latihan</span>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Action Bar (Kembali & Cetak Laporan) */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep('form')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={() => setIsPrintOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan</span>
                  </button>
                </div>

                {/* Filter Summary Metadata Info */}
                <div className="border border-slate-200 rounded overflow-hidden divide-y divide-slate-200 text-xs font-sans">
                  <div className="grid grid-cols-[240px_1fr] bg-slate-50/50 p-3 items-center">
                    <div className="font-bold text-slate-700">Tanggal Transaksi</div>
                    <div className="font-semibold text-slate-900 font-mono">
                      {formatDateLabel(startDate)} s/d {formatDateLabel(endDate)}
                    </div>
                  </div>
                  <div className="grid grid-cols-[240px_1fr] p-3 items-center">
                    <div className="font-bold text-slate-700">Jenis Transaksi</div>
                    <div className="font-semibold text-slate-900">
                      {transactionType}
                    </div>
                  </div>
                  <div className="grid grid-cols-[240px_1fr] bg-slate-50/50 p-3 items-center">
                    <div className="font-bold text-slate-700">
                      Total Pemasukan Transaksi {transactionType === 'Semua Transaksi' ? '' : transactionType}
                    </div>
                    <div className="font-bold text-slate-900 font-mono text-sm">
                      Rp. {grandTotal.toLocaleString('id-ID')}
                    </div>
                  </div>
                  {ppnFormat === 'Ya' && (
                    <div className="grid grid-cols-[240px_1fr] p-3 items-center">
                      <div className="font-bold text-slate-700">Format Laporan PPN</div>
                      <div className="font-semibold text-slate-900">
                        PPN 10% (DPP: Rp. {Math.round(grandTotal / 1.1).toLocaleString('id-ID')} | PPN: Rp. {Math.round(grandTotal - (grandTotal / 1.1)).toLocaleString('id-ID')})
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Title */}
                <div className="pt-2">
                  <h3 className="text-base font-bold text-slate-800">Transaksi Latihan</h3>
                </div>

                {/* Table Component */}
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none">
                        <th className="py-2.5 px-3 border-r border-slate-400 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Tanggal Transaksi</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Nomor Transaksi</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Nomor Anggota</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Nama Anggota</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Nama Pelatih</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Paket Anggota</th>
                        <th className="py-2.5 px-3 border-r border-slate-400">Jenis Pembayaran</th>
                        <th className="py-2.5 px-3 text-right">Total Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredList.length > 0 ? (
                        filteredList.map((r, idx) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedReceiptItem(r)}
                            title="Klik untuk melihat kwitansi transaksi PT"
                            className="hover:bg-cyan-50/60 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono text-slate-600">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono">
                              {formatDateLabel(r.created_at)}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">
                              {r.transaction_number || `PRABU-PT-${r.id.substring(0, 7).toUpperCase()}`}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-700 font-bold">
                              {r.member_username || '-'}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-bold text-slate-900">
                              {r.member_name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 text-slate-800">
                              {r.trainer_name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 uppercase font-semibold text-slate-800">
                              {r.package_name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-800">
                              {r.payment_method}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {r.total_amount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                            Tidak ada data transaksi pendaftaran latihan untuk filter yang dipilih.
                          </td>
                        </tr>
                      )}
                      <tr className="bg-[#6C7A89] text-white font-bold border-t-2 border-slate-400">
                        <td colSpan={8} className="py-3 px-4 text-left uppercase tracking-wider text-xs font-bold text-white">
                          Grand Total
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-white">
                          {grandTotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT REPORT MODAL / TEMPLATE */}
      {isPrintOpen && (
        <WorkoutRegistrationReportPrintTemplate
          onClose={() => setIsPrintOpen(false)}
          title="LAPORAN TRANSAKSI PENDAFTARAN LATIHAN"
          data={{
            startDate,
            endDate,
            transactionType,
            ppnFormat,
            totalTransactions: filteredList.length,
            grandTotal,
            cashierName: user?.full_name || 'Staff Prabu Gym',
            registrations: filteredList,
          }}
        />
      )}

      {/* INDIVIDUAL RECEIPT MODAL */}
      {selectedReceiptItem && (
        <OfficialPTReceiptTemplate
          onClose={() => setSelectedReceiptItem(null)}
          data={{
            transactionNumber: selectedReceiptItem.transaction_number || `PRABU-PT-${selectedReceiptItem.id.substring(0, 7).toUpperCase()}`,
            transactionDate: selectedReceiptItem.created_at,
            memberUsername: selectedReceiptItem.member_username || '-',
            memberName: selectedReceiptItem.member_name,
            packageName: selectedReceiptItem.package_name,
            sessionCount: selectedReceiptItem.sessions_count || 10,
            membershipEnd: selectedReceiptItem.created_at,
            paymentMethod: selectedReceiptItem.payment_method,
            price: selectedReceiptItem.total_amount,
            trainerName: selectedReceiptItem.trainer_name,
            cashierName: selectedReceiptItem.admin_name || user?.full_name || 'Staff Prabu Gym'
          }}
        />
      )}
    </div>
  );
}
