'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface CardReport {
  month: string;
  total_cards: number;
  total_revenue: number;
}

export default function CardReplacementReportsPage() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<CardReport[]>([]);
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
          { month: 'Juli 2026', total_cards: 14, total_revenue: 350000 },
          { month: 'Juni 2026', total_cards: 22, total_revenue: 550000 },
          { month: 'Mei 2026', total_cards: 18, total_revenue: 450000 }
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
        <h2 className="text-3xl font-heading text-slate-800">LAPORAN REKAP CETAK KARTU</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Rangkuman penerimaan kas dari biaya denda / cetak ulang kartu fisik anggota
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading laporan cetak kartu...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Rekapitulasi Administrasi Kartu Anggota</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Bulan & Periode</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Jumlah Kartu Dicetak</th>
                    <th className="py-3 px-4 text-right">Total Pendapatan Cetak (Kas Masuk)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {reports.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{r.month}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center font-bold text-slate-850">{r.total_cards} Kartu</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-black">Rp {r.total_revenue.toLocaleString('id-ID')}</td>
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
