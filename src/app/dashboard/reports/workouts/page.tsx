'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import { WorkoutReportTemplate, OfficialPTReceiptTemplate } from '@/components/core/PrintTemplates';
import { formatDateLabel, formatIDR } from '@/core/constants';
import { Printer, Dumbbell } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';

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
  const lastFetchedBranchRef = useRef<string | null>(null);
  const [registrations, setRegistrations] = useState<PTRegistrationReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<PTRegistrationReportItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!authLoading && activeBranchID && (lastFetchedBranchRef.current !== activeBranchID || dateFrom || dateTo)) {
      lastFetchedBranchRef.current = activeBranchID;
      fetchRegistrations();
    }
  }, [activeBranchID, dateFrom, dateTo, authLoading]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/admin/pt-registrations?branch_id=${activeBranchID}&per_page=200`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setRegistrations(res.data);
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

  const getFilteredRegistrations = () => {
    if (!searchQuery.trim()) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter(
      r =>
        r.member_name.toLowerCase().includes(q) ||
        (r.member_username && r.member_username.toLowerCase().includes(q)) ||
        r.package_name.toLowerCase().includes(q) ||
        r.trainer_name.toLowerCase().includes(q)
    );
  };

  const filteredList = getFilteredRegistrations();
  const grandTotal = filteredList.reduce((acc, curr) => acc + curr.total_amount, 0);

  const handleExportExcel = () => {
    const headers = [
      'No',
      'Tanggal Transaksi',
      'Nomor Transaksi',
      'Nomor Anggota',
      'Nama Anggota',
      'Paket Latihan',
      'Pelatih / PT',
      'Metode Bayar',
      'Total Biaya',
    ];
    const data = filteredList.map((r, idx) => [
      idx + 1,
      formatDateLabel(r.created_at),
      r.transaction_number || `PRABU-PT-${r.id.substring(0, 7).toUpperCase()}`,
      r.member_username ? `@${r.member_username}` : '-',
      r.member_name,
      r.package_name,
      r.trainer_name,
      r.payment_method,
      r.total_amount,
    ]);

    exportToExcel({
      filename: `Laporan_Pendaftaran_Latihan_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN TRANSAKSI PENDAFTARAN LATIHAN (PT) - PRABU GYM',
      headers,
      data,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="no-print space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-heading text-slate-800 uppercase tracking-tight">LAPORAN PENDAFTARAN LATIHAN (PT)</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-accent">
              Rekapitulasi Seluruh Transaksi Pendaftaran Latihan / Sesi PT Anggota
            </p>
          </div>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama member, nomor anggota, paket, atau pelatih..."
          onExportExcel={handleExportExcel}
        >
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 text-xs rounded font-mono font-bold"
            />
            <span className="text-slate-400 text-xs font-bold">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 text-xs rounded font-mono font-bold"
            />
          </div>
        </SearchFilterBar>

        <FetchErrorAlert error={error} featureName="Laporan Pendaftaran Latihan" onRetry={fetchRegistrations} />

        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center justify-between select-none">
            <span className="text-sm uppercase tracking-wider font-heading flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span>Daftar Transaksi Pendaftaran Latihan</span>
            </span>
            <span className="text-xs font-mono font-bold">Total: {filteredList.length} Transaksi</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse font-bold">
                <thead>
                  <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-3 border-r border-slate-350 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Tanggal</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Nomor Transaksi</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Nama Anggota</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Paket Latihan</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Pelatih (PT)</th>
                    <th className="py-2.5 px-3 border-r border-slate-350">Bayar</th>
                    <th className="py-2.5 px-3 text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredList.length > 0 ? (
                    filteredList.map((r, idx) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReceiptItem(r)}
                        title="Klik untuk melihat kwitansi transaksi PT"
                        className="hover:bg-cyan-50/60 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono text-slate-600">{idx + 1}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(r.created_at)}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">
                          {r.transaction_number || `PRABU-PT-${r.id.substring(0, 7).toUpperCase()}`}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-bold text-slate-800">
                          {r.member_name} {r.member_username ? <span className="font-mono text-slate-500 font-bold">(@{r.member_username})</span> : ''}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-bold uppercase">{r.package_name}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-slate-800">{r.trainer_name}</td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-bold">{r.payment_method}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatIDR(r.total_amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                        Tidak ada transaksi pendaftaran latihan.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-xs text-slate-700">
                      Grand Total
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#DC3545]">
                      {formatIDR(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isPrintOpen && (
        <WorkoutReportTemplate
          onClose={() => setIsPrintOpen(false)}
          title="LAPORAN TRANSAKSI PENDAFTARAN LATIHAN (PT)"
          data={{
            startDate: dateFrom,
            endDate: dateTo,
            totalTransactions: filteredList.length,
            grandTotal,
            cashierName: user?.full_name || 'Staff Prabu Gym',
            registrations: filteredList,
          }}
        />
      )}

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
