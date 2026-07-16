'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface CommissionReport {
  instructor_name: string;
  total_classes: number;
  rate_per_class: number;
  total_commission: number;
}

export default function ClassCommissionReportsPage() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<CommissionReport[]>([]);
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
          { instructor_name: 'Siska Amanda', total_classes: 12, rate_per_class: 150000, total_commission: 1800000 },
          { instructor_name: 'Coach Jessica', total_classes: 8, rate_per_class: 150000, total_commission: 1200000 },
          { instructor_name: 'Master Wong', total_classes: 10, rate_per_class: 200000, total_commission: 2000000 }
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
        <h2 className="text-3xl font-heading text-slate-800">LAPORAN KOMISI KELAS</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Rangkuman honorarium & komisi mengajar instruktur kelas aerobik / kungfu / pilates
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading laporan komisi kelas...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Rekapitulasi Insentif Mengajar Instruktur</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Instruktur</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Jumlah Sesi Kelas</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-right">Fee Per Kelas</th>
                    <th className="py-3 px-4 text-right">Total Komisi Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {reports.map((r) => (
                    <tr key={r.instructor_name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{r.instructor_name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center font-bold text-slate-850">{r.total_classes} Kelas</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-right text-slate-600">Rp {r.rate_per_class.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-black">Rp {r.total_commission.toLocaleString('id-ID')}</td>
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
