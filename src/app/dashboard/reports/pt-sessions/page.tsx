'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PTReport {
  trainer_name: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
}

export default function PTSessionReportsPage() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<PTReport[]>([]);
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
          { trainer_name: 'Coach Rian', total_sessions: 32, completed_sessions: 30, cancelled_sessions: 2 },
          { trainer_name: 'Coach Budi', total_sessions: 24, completed_sessions: 24, cancelled_sessions: 0 },
          { trainer_name: 'Coach Jessica', total_sessions: 15, completed_sessions: 14, cancelled_sessions: 1 }
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
        <h2 className="text-3xl font-heading text-slate-800">LAPORAN SESI PERSONAL TRAINER</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Rangkuman penyelesaian sesi latihan privat anggota bersama pelatih (PT)
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading laporan sesi PT...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Rekapitulasi Kinerja Sesi Pelatih</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Personal Trainer</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Total Terjadwal</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Sesi Selesai</th>
                    <th className="py-3 px-4 text-center">Sesi Batal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {reports.map((r) => (
                    <tr key={r.trainer_name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{r.trainer_name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center font-bold text-slate-800">{r.total_sessions} Sesi</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center text-emerald-700 font-black">{r.completed_sessions} Sesi</td>
                      <td className="py-3.5 px-4 text-center text-red-500 font-black">{r.cancelled_sessions} Sesi</td>
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
