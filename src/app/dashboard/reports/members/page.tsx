'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { transactionsApi } from '@/core/api';
import { getPaymentMethodFromNotes, getMembershipTypeFromNotes, formatDateLabel, formatIDR } from '@/core/constants';
import { Transaction } from '@/core/types';
import { ReportTemplate, OfficialReceiptTemplate } from '@/components/core/PrintTemplates';
import { FileText, ArrowLeft, Printer, List } from 'lucide-react';
import FieldInfo from '@/components/core/FieldInfo';
import { DatePicker } from '@/components/core/DatePicker';

export default function MemberReportsPage() {
  const { activeBranchID, user } = useAuth();

  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('Semua Transaksi');
  const [manualTxType, setManualTxType] = useState('');
  const [daysCount, setDaysCount] = useState('Semua Hari');
  const [manualDaysCount, setManualDaysCount] = useState('');
  const [ppnFormat, setPpnFormat] = useState('PPN 10%');

  // Navigation step: 'form' | 'result'
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [loading, setLoading] = useState(false);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Default date intervals
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate() - 7);
    const aWeekAgoStr = aWeekAgo.toISOString().split('T')[0];

    setStartDate(aWeekAgoStr);
    setEndDate(today);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await transactionsApi.list({
        branch_id: activeBranchID || undefined,
        member_only: true,
        per_page: 500
      });
      let txsList: Transaction[] = [];

      if (res.success && res.data && res.data.length > 0) {
        txsList = res.data;
      } else {
        txsList = [];
      }

      // Filter transactions to only those belonging to member transactions
      let filtered = txsList.filter(tx =>
        tx.member_id ||
        tx.member_name ||
        (tx.notes && (tx.notes.toLowerCase().includes('anggota') || tx.notes.toLowerCase().includes('member') || tx.notes.toLowerCase().includes('pembayaran')))
      );

      // Filter by Date Range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(tx => new Date(tx.transaction_date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(tx => new Date(tx.transaction_date) <= end);
      }

      // Filter by Jenis Transaksi (Payment Method)
      const selectedType = transactionType === 'manual' ? manualTxType : transactionType;
      if (selectedType !== 'Semua Transaksi') {
        filtered = filtered.filter(tx => {
          const method = getPaymentMethodFromNotes(tx.notes || '');
          return method.toLowerCase() === selectedType.toLowerCase();
        });
      }

      // Filter by Jumlah Hari (Days Count)
      if (daysCount !== 'Semua Hari') {
        const days = daysCount === '30 Hari' ? 30 : daysCount === '90 Hari' ? 90 : parseInt(manualDaysCount.replace(/\D/g, ''));
        if (!isNaN(days) && days > 0) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          cutoff.setHours(0, 0, 0, 0);
          filtered = filtered.filter(tx => new Date(tx.transaction_date) >= cutoff);
        }
      }

      setFilteredTxs(filtered);
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isPpnActive = ppnFormat === 'PPN 10%';
  const totalPembayaran = filteredTxs.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalPpn = isPpnActive ? totalPembayaran * 0.10 : 0;
  const grandTotal = totalPembayaran;

  const activeTxTypeLabel = transactionType === 'manual' ? manualTxType : transactionType;

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Top Header */}
      {step === 'form' ? (
        <div className="flex justify-between items-center flex-wrap gap-4 no-print">
          <div>
            <h2 className="text-3xl font-heading text-slate-800 uppercase">LAPORAN FITNES ANGGOTA</h2>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
              REKAP & LAPORAN TRANSAKSI ANGGOTA FITNES CLUB GYM
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center flex-wrap gap-4 no-print">
          <div>
            <h2 className="text-2xl font-heading text-slate-800 uppercase">Daftar Laporan Fitnes Anggota</h2>
            <p className="text-slate-500 text-xs mt-0.5 uppercase tracking-widest font-accent">
              Laporan Hasil Filter Transaksi Anggota
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              onClick={() => setShowPrintReport(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      )}

      {step === 'form' ? (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-visible w-full no-print">
          <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <FileText className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">LAPORAN FITNES ANGGOTA</span>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleGenerate} className="space-y-6 w-full text-slate-700">
              <div className="space-y-5">

                {/* Dari Tanggal */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Dari Tanggal
                    <FieldInfo text="Pilih tanggal mulai periode laporan" />
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={(val) => setStartDate(val)}
                  />
                </div>

                {/* Sampai Tanggal */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Sampai Tanggal
                    <FieldInfo text="Pilih tanggal akhir periode laporan" />
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                  />
                </div>

                {/* Jenis Transaksi */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Jenis Transaksi
                    <FieldInfo text="Pilih metode pembayaran atau jenis transaksi" />
                  </label>
                  <div className="space-y-2 w-full">
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20 focus:border-brand-cyan transition-all bg-white cursor-pointer"
                    >
                      <option value="Semua Transaksi">Semua Transaksi</option>
                      <option value="Tunai">Tunai</option>
                      <option value="BCA Transfer">BCA Transfer</option>
                      <option value="manual">Input Manual...</option>
                    </select>
                    {transactionType === 'manual' && (
                      <input
                        type="text"
                        placeholder="Masukkan jenis transaksi kustom..."
                        value={manualTxType}
                        onChange={(e) => setManualTxType(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20 focus:border-brand-cyan transition-all bg-white"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Jumlah Hari */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Jumlah Hari
                    <FieldInfo text="Filter berdasarkan jumlah hari rentang transaksi" />
                  </label>
                  <div className="space-y-2 w-full">
                    <select
                      value={daysCount}
                      onChange={(e) => setDaysCount(e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20 focus:border-brand-cyan transition-all bg-white cursor-pointer"
                    >
                      <option value="Semua Hari">Semua Hari</option>
                      <option value="30 Hari">30 Hari</option>
                      <option value="90 Hari">90 Hari</option>
                      <option value="manual">Input Manual...</option>
                    </select>
                    {daysCount === 'manual' && (
                      <input
                        type="text"
                        placeholder="Masukkan jumlah hari kustom (contoh: 15)..."
                        value={manualDaysCount}
                        onChange={(e) => setManualDaysCount(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20 focus:border-brand-cyan transition-all bg-white"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Format PPN */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Format PPN
                    <FieldInfo text="Pilih format PPN 10% atau tanpa PPN" />
                  </label>
                  <select
                    value={ppnFormat}
                    onChange={(e) => setPpnFormat(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20 focus:border-brand-cyan transition-all bg-white cursor-pointer"
                  >
                    <option value="PPN 10%">PPN 10%</option>
                    <option value="Non-PPN">Tanpa PPN (Non-PPN)</option>
                  </select>
                </div>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? 'PROSES...' : 'GENERATE LAPORAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn no-print">
          {/* Summary Table Card matching screenshot */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="bg-brand-cyan px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Ringkasan Laporan Fitnes Anggota</span>
            </div>
            <div className="p-4">
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 font-bold bg-slate-50 border-r border-slate-200 w-1/3 text-slate-700">Tanggal Transaksi</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatDateLabel(startDate)} s/d {formatDateLabel(endDate)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 font-bold bg-slate-50 border-r border-slate-200 text-slate-700">Jenis Transaksi</td>
                      <td className="py-2 px-3 font-bold uppercase text-slate-900">{activeTxTypeLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 font-bold bg-slate-50 border-r border-slate-200 text-slate-700">Total Pemasukan Transaksi</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">{formatIDR(totalPembayaran)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold bg-slate-50 border-r border-slate-200 text-slate-700">Nama Staff</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{user?.full_name || 'Prabu GYM Admin'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Transactions Table matching screenshot */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="bg-brand-cyan px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <List className="w-4 h-4" />
              <span>Transaksi Anggota</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-bold">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px]">
                    <th className="py-2.5 px-2 border-r border-slate-200 text-center w-10">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Tanggal Transaksi</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nomor Transaksi</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nomor Anggota</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nama Anggota</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Paket Anggota</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Jenis Pembayaran</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Total Pembayaran</th>
                    <th className="py-2.5 px-3">Nama CS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTxs.length > 0 ? (
                    filteredTxs.map((tx, idx) => {
                      const method = getPaymentMethodFromNotes(tx.notes || '') || tx.payment_method || '-';
                      const pkg = getMembershipTypeFromNotes(tx.notes || '') || '-';
                      const memberNo = tx.member_username || '-';

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedReceiptTx(tx)}
                          title="Klik untuk melihat kwitansi transaksi"
                          className="hover:bg-cyan-50/60 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono text-slate-600">{idx + 1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono">{formatDateLabel(tx.transaction_date)}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-brand-cyan">{tx.transaction_number}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800">{memberNo}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-900">{tx.member_name || '-'}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 uppercase">{pkg}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 uppercase">{method}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-emerald-700">{formatIDR(tx.total_amount)}</td>
                          <td className="py-2.5 px-3 text-slate-700">{tx.admin_name || '-'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                        Tidak ada transaksi anggota ditemukan pada rentang periode ini.
                      </td>
                    </tr>
                  )}
                  {filteredTxs.length > 0 && (
                    <tr className="bg-slate-50 font-black border-t-2 border-slate-300">
                      <td colSpan={7} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-800">
                        Total Pemasukan
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-[#DC3545]">
                        {formatIDR(totalPembayaran)}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Print Modal */}
      {showPrintReport && (
        <ReportTemplate
          onClose={() => setShowPrintReport(false)}
          title="PRABU MEMBER REPORT"
          data={{
            startDate,
            endDate,
            transactionType: activeTxTypeLabel,
            totalRevenue: totalPembayaran,
            totalPpn: totalPpn,
            grandTotal: grandTotal,
            cashierName: user?.full_name || 'Kasir Prabu GYM',
            transactions: filteredTxs.map(tx => {
              const method = getPaymentMethodFromNotes(tx.notes || '') || tx.payment_method || '-';
              const pkg = getMembershipTypeFromNotes(tx.notes || '') || '-';
              const txPpn = isPpnActive ? tx.total_amount * 0.10 : 0;
              const txSubtotal = isPpnActive ? tx.total_amount - txPpn : tx.total_amount;
              return {
                id: tx.id,
                transactionDate: tx.transaction_date,
                transactionNumber: tx.transaction_number,
                memberId: tx.member_id,
                memberName: tx.member_name,
                memberUsername: tx.member_username || '',
                packageName: pkg,
                paymentMethod: method,
                totalAmount: tx.total_amount,
                ppn: txPpn,
                subtotal: txSubtotal,
                adminName: tx.admin_name
              };
            })
          }}
        />
      )}

      {/* Individual Receipt Modal when a row is clicked */}
      {selectedReceiptTx && (
        <OfficialReceiptTemplate
          onClose={() => setSelectedReceiptTx(null)}
          data={{
            transactionNumber: selectedReceiptTx.transaction_number,
            transactionDate: selectedReceiptTx.transaction_date,
            memberUsername: selectedReceiptTx.member_username || '-',
            memberName: selectedReceiptTx.member_name || 'Member',
            packageName: getMembershipTypeFromNotes(selectedReceiptTx.notes || '') || 'Paket Anggota',
            membershipStart: selectedReceiptTx.transaction_date,
            membershipEnd: selectedReceiptTx.transaction_date,
            paymentMethod: getPaymentMethodFromNotes(selectedReceiptTx.notes || '') || selectedReceiptTx.payment_method || 'Tunai',
            price: selectedReceiptTx.total_amount,
            cashierName: selectedReceiptTx.admin_name || user?.full_name || 'Kasir Prabu GYM'
          }}
        />
      )}
    </div>
  );
}
