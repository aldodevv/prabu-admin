'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import { getSessionCountFromPackage } from '@/core/constants';
import { Printer, UserCheck, Calendar } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';

interface PTSessionReportItem {
  trainer_name: string;
  total_clients: number;
  total_sessions: number;
  completed_sessions: number;
  remaining_sessions: number;
}

export default function PTSessionReportsPage() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<PTSessionReportItem[]>([]);
  const [trainers, setTrainers] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('Semua');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchPTSessionReports();
    }
  }, [activeBranchID, dateFrom, dateTo]);

  const fetchPTSessionReports = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/admin/pt-registrations?branch_id=${activeBranchID}&per_page=200`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        const rawRegs: any[] = res.data;
        const trainerMap: { [key: string]: PTSessionReportItem } = {};
        const trainerNamesSet = new Set<string>();

        rawRegs.forEach(reg => {
          const tName = reg.trainer_name || 'Tidak Ada Pelatih';
          trainerNamesSet.add(tName);

          if (!trainerMap[tName]) {
            trainerMap[tName] = {
              trainer_name: tName,
              total_clients: 0,
              total_sessions: 0,
              completed_sessions: 0,
              remaining_sessions: 0,
            };
          }

          let logsCount = 0;
          let totalSess = getSessionCountFromPackage(reg.package_name || '');
          let remainingSess = totalSess;

          if (reg.notes) {
            try {
              const parsed = JSON.parse(reg.notes);
              if (parsed.logs && Array.isArray(parsed.logs)) {
                logsCount = parsed.logs.reduce((acc: number, item: any) => acc + (item.used_sessions || 1), 0);
              }
              if (parsed.total_sessions !== undefined && parsed.total_sessions > 0) {
                totalSess = parsed.total_sessions;
              }
              if (parsed.remaining_sessions !== undefined) {
                remainingSess = parsed.remaining_sessions;
              } else {
                remainingSess = Math.max(0, totalSess - logsCount);
              }
            } catch {
              remainingSess = Math.max(0, totalSess - logsCount);
            }
          }

          trainerMap[tName].total_clients += 1;
          trainerMap[tName].total_sessions += totalSess;
          trainerMap[tName].completed_sessions += logsCount;
          trainerMap[tName].remaining_sessions += remainingSess;
        });

        setReports(Object.values(trainerMap));
        setTrainers(Array.from(trainerNamesSet));
      } else {
        setError(res.error || 'Gagal memuat data laporan sesi PT');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan koneksi server');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    return reports.filter(r => {
      if (selectedTrainer !== 'Semua' && r.trainer_name !== selectedTrainer) return false;
      if (searchQuery.trim() && !r.trainer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const filtered = getFilteredReports();
  const totalCompletedAll = filtered.reduce((acc, curr) => acc + curr.completed_sessions, 0);
  const totalClientsAll = filtered.reduce((acc, curr) => acc + curr.total_clients, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nama Personal Trainer', 'Total Client Anggota', 'Total Sesi Terjadwal', 'Sesi Dijalani (Selesai)', 'Sisa Sesi'];
    const data = filtered.map((r, idx) => [
      idx + 1,
      r.trainer_name,
      r.total_clients,
      r.total_sessions,
      r.completed_sessions,
      r.remaining_sessions,
    ]);

    exportToExcel({
      filename: `Laporan_Sesi_PT_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKAPITULASI SESI PERSONAL TRAINER (PT) - PRABU GYM',
      headers,
      data,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-pt-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-heading text-slate-800 uppercase tracking-tight">LAPORAN SESI PERSONAL TRAINER</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-accent">
              Rangkuman Total Sesi Latihan Yang Dijalani Per Trainer Pada Periode Waktu Terpilih
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama pelatih trainer..."
          onExportExcel={handleExportExcel}
        >
          <div className="flex items-center gap-3">
            <select
              value={selectedTrainer}
              onChange={e => setSelectedTrainer(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 text-xs rounded font-semibold cursor-pointer"
            >
              <option value="Semua">Pelatih: Semua Trainer</option>
              {trainers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 text-xs rounded font-mono"
              />
              <span className="text-slate-400 text-xs font-bold">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 text-xs rounded font-mono"
              />
            </div>
          </div>
        </SearchFilterBar>

        <FetchErrorAlert error={error} featureName="Laporan Sesi Personal Trainer" onRetry={fetchPTSessionReports} />

        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden" id="print-pt-area">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center justify-between select-none">
            <span className="text-sm uppercase tracking-wider font-heading flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Rekapitulasi Kinerja Sesi Pelatih (PT)</span>
            </span>
            <span className="text-xs font-mono">Total Completed: {totalCompletedAll} Sesi</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-4 border-r border-slate-350 w-12 text-center">No</th>
                    <th className="py-2.5 px-4 border-r border-slate-350">Nama Personal Trainer</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 text-center">Total Client Anggota</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 text-center">Total Sesi Terjadwal</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 text-center">Sesi Dijalani (Selesai)</th>
                    <th className="py-2.5 px-4 text-center">Sisa Sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {filtered.length > 0 ? (
                    filtered.map((r, idx) => (
                      <tr key={r.trainer_name} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center border-r border-slate-100 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border-r border-slate-100">{r.trainer_name}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-bold text-slate-800">{r.total_clients} Member</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-600">{r.total_sessions} Sesi</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-emerald-700 font-black">{r.completed_sessions} Sesi</td>
                        <td className="py-3 px-4 text-center text-amber-600 font-black">{r.remaining_sessions} Sesi</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Tidak ada data sesi pelatih untuk filter terpilih.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-xs text-slate-700">
                      Total Seluruh Pelatih
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{totalClientsAll} Member</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-emerald-700">{totalCompletedAll} Sesi Completed</td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
