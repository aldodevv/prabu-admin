'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { trainersApi } from '@/core/api';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import { PTSessionReportPrintTemplate } from '@/components/core/PrintTemplates';
import { formatDateLabel, getSessionCountFromPackage } from '@/core/constants';
import { Printer, LayoutGrid, ArrowLeft } from 'lucide-react';
import { DatePicker } from '@/components/core/DatePicker';
import { Trainer } from '@/core/types';

interface PTSessionReportItem {
  id: string;
  transaction_date: string;
  member_name: string;
  member_username?: string;
  package_name: string;
  session_count: number;
  trainer_name: string;
}

export default function PTSessionReportsPage() {
  const { activeBranchID, user, loading: authLoading } = useAuth();

  // Navigation Step: 'form' | 'result'
  const [step, setStep] = useState<'form' | 'result'>('form');

  // Form Filter States
  const [trainersList, setTrainersList] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data & Status
  const [sessions, setSessions] = useState<PTSessionReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Fetch trainers
  useEffect(() => {
    if (activeBranchID) {
      trainersApi.list(activeBranchID).then(res => {
        if (res.success && res.data) {
          setTrainersList(res.data);
        }
      }).catch(() => { });
    }
  }, [activeBranchID]);

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
        const rawRegs: any[] = res.data;
        let items: PTSessionReportItem[] = [];

        rawRegs.forEach(reg => {
          const tName = (reg.trainer_name || '').trim();
          let parsedNotes: any = null;
          if (reg.notes) {
            try {
              if (reg.notes.startsWith('{') || reg.notes.startsWith('[')) {
                parsedNotes = JSON.parse(reg.notes);
              }
            } catch { }
          }

          // Case 1: If session logs exist in notes JSON, expand each session log entry
          if (parsedNotes && Array.isArray(parsedNotes.logs) && parsedNotes.logs.length > 0) {
            parsedNotes.logs.forEach((log: any, logIdx: number) => {
              const logTrainer = (log.trainer_name || tName || '').trim();

              // Filter by selected trainer
              if (selectedTrainer && selectedTrainer !== 'Semua' && selectedTrainer !== '-Pilih-') {
                const sel = selectedTrainer.toLowerCase();
                const logT = logTrainer.toLowerCase();
                if (!logT.includes(sel) && !sel.includes(logT)) {
                  return;
                }
              }

              const logDate = log.date || (reg.registration_date ? reg.registration_date.split('T')[0] : '');

              // Filter by Date Range
              if (startDate && logDate && logDate < startDate) return;
              if (endDate && logDate && logDate > endDate) return;

              items.push({
                id: `${reg.id}-log-${logIdx}`,
                transaction_date: logDate || new Date().toISOString().split('T')[0],
                member_name: reg.member_name || 'Member',
                member_username: reg.member_username || '',
                package_name: reg.package_name || 'PT Sesi',
                session_count: Number(log.used_sessions) || 1,
                trainer_name: logTrainer || 'Pelatih',
              });
            });
          } else {
            // Case 2: Fallback for records where logs were not yet itemized individually in JSON
            if (selectedTrainer && selectedTrainer !== 'Semua' && selectedTrainer !== '-Pilih-') {
              const sel = selectedTrainer.toLowerCase();
              const logT = tName.toLowerCase();
              if (!logT.includes(sel) && !sel.includes(logT)) {
                return;
              }
            }

            const txDate = reg.registration_date || (reg.created_at ? reg.created_at.split('T')[0] : '');

            // Filter by Date Range
            if (startDate && txDate && txDate < startDate) return;
            if (endDate && txDate && txDate > endDate) return;

            // In Rekap Sesi, each session conducted is represented with count 1
            const usedCount = parsedNotes && parsedNotes.total_sessions && parsedNotes.remaining_sessions !== undefined
              ? (parsedNotes.total_sessions - parsedNotes.remaining_sessions)
              : 1;

            const safeUsedCount = Math.max(1, usedCount);
            for (let i = 0; i < safeUsedCount; i++) {
              items.push({
                id: `${reg.id}-s-${i}`,
                transaction_date: txDate || new Date().toISOString().split('T')[0],
                member_name: reg.member_name || 'Member',
                member_username: reg.member_username || '',
                package_name: reg.package_name || 'PT Sesi',
                session_count: 1,
                trainer_name: tName || 'Pelatih',
              });
            }
          }
        });

        // Sort by transaction date descending
        items.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

        setSessions(items);
        setStep('result');
      } else {
        setError(res.error || 'Gagal memuat data laporan sesi personal trainer');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan koneksi server');
    } finally {
      setLoading(false);
    }
  };

  const totalSessions = sessions.reduce((acc, curr) => acc + (curr.session_count || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="no-print space-y-6">

        {/* STEP 1: FORM FILTER INPUT (GENERATOR) */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-accent">
              <span>Laporan</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Laporan Sesi Personal Trainner</span>
            </div>

            {error && (
              <FetchErrorAlert error={error} featureName="Laporan Sesi Personal Trainer" onRetry={handleGenerate} />
            )}

            {/* Main Form Card */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-visible">
              <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none rounded-t">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider font-heading">Laporan Sesi Personal Trainner</span>
              </div>

              <div className="p-6 md:p-8">
                <form onSubmit={handleGenerate} className="space-y-5 text-sm text-slate-700 max-w-3xl">
                  {/* Nama Pelatih */}
                  <div className="grid grid-cols-[200px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-xs font-semibold text-right max-sm:text-left text-slate-600 font-accent uppercase tracking-wider">
                      Nama Pelatih
                    </label>
                    <select
                      value={selectedTrainer}
                      onChange={(e) => setSelectedTrainer(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded w-full cursor-pointer font-medium"
                    >
                      <option value="">-Pilih-</option>
                      <option value="Semua">Semua Pelatih</option>
                      {trainersList.map((t) => (
                        <option key={t.id} value={t.full_name}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

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
              <span>Laporan Fitness</span>
              <span className="text-slate-400">/</span>
              <span>Laporan Sesi Personal Trainner</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Daftar Sesi Personal Trainner</span>
            </div>

            {/* Main Result Card */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider font-heading">Daftar Sesi Personal Trainner</span>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Action Bar (Kembali & Cetak Komisi Pelatih) */}
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
                    <span>Cetak Komisi Pelatih</span>
                  </button>
                </div>

                {/* Summary Metadata Box */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2.5 px-4 font-bold bg-white text-slate-700 w-64 border-r border-slate-200">
                          Tanggal Transaksi
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                          {startDate ? formatDateLabel(startDate) : 'Awal'} s/d {endDate ? formatDateLabel(endDate) : 'Sekarang'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold bg-white text-slate-700 w-64 border-r border-slate-200">
                          Nama Pelatih
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          {selectedTrainer || 'Semua Pelatih'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Main Data Table */}
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                        <th className="py-2.5 px-4 border-r border-slate-400 w-12 text-center">No</th>
                        <th className="py-2.5 px-4 border-r border-slate-400">Tanggal Transaksi</th>
                        <th className="py-2.5 px-4 border-r border-slate-400">Nama Anggota</th>
                        <th className="py-2.5 px-4 border-r border-slate-400">Paket Latihan</th>
                        <th className="py-2.5 px-4 text-center w-28">Jumlah Sesi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {sessions.length > 0 ? (
                        sessions.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-center border-r border-slate-100 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono font-bold text-slate-700">
                              {formatDateLabel(row.transaction_date)}
                            </td>
                            <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                              {row.member_name}
                            </td>
                            <td className="py-3 px-4 border-r border-slate-100 font-bold uppercase text-slate-800">
                              {row.package_name}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                              {row.session_count}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            Tidak ada data sesi personal trainer untuk periode dan pelatih terpilih.
                          </td>
                        </tr>
                      )}

                      {/* Footer Row (Total Sesi) */}
                      <tr className="bg-[#6C7A89] text-white font-bold">
                        <td colSpan={4} className="py-3 px-4 font-bold text-white uppercase tracking-wider text-xs">
                          Total Sesi
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm text-white">
                          {totalSessions}
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

      {/* PRINT REPORT MODAL */}
      {isPrintOpen && (
        <PTSessionReportPrintTemplate
          title="DAFTAR SESI PERSONAL TRAINNER"
          onClose={() => setIsPrintOpen(false)}
          data={{
            startDate,
            endDate,
            trainerName: selectedTrainer || 'Semua Pelatih',
            totalSessions,
            cashierName: user?.username || 'Staff PRABU GYM',
            sessions: sessions.map(s => ({
              id: s.id,
              transaction_date: s.transaction_date,
              member_name: s.member_name,
              member_username: s.member_username,
              package_name: s.package_name,
              session_count: s.session_count,
            })),
          }}
        />
      )}
    </div>
  );
}
