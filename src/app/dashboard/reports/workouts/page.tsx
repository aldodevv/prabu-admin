'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WorkoutReport {
  date: string;
  total_checkins: number;
  total_checkouts: number;
  avg_duration_minutes: number;
}

export default function WorkoutReportsPage() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<WorkoutReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchReports();
    }
  }, [activeBranchID]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setReports([
          { date: '15-07-2026', total_checkins: 45, total_checkouts: 42, avg_duration_minutes: 72 },
          { date: '14-07-2026', total_checkins: 38, total_checkouts: 35, avg_duration_minutes: 68 },
          { date: '13-07-2026', total_checkins: 52, total_checkouts: 50, avg_duration_minutes: 75 }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">LAPORAN KUNJUNGAN & LATIHAN</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Laporan riwayat kunjungan latihan masuk / keluar anggota per tanggal
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading laporan latihan...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Rekap Jumlah Check-in & Durasi Latihan Harian</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tanggal</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Total Scan Masuk (Check-in)</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Total Scan Keluar (Check-out)</th>
                    <th className="py-3 px-4 text-right">Rata-rata Durasi Latihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {reports.map((r) => (
                    <tr key={r.date} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 border-r border-slate-100">{r.date}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center font-bold text-slate-800">{r.total_checkins} Orang</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center text-slate-600">{r.total_checkouts} Orang</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-black">{r.avg_duration_minutes} Menit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
