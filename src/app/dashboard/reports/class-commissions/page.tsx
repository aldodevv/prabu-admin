'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { Printer, Award } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchReports();
    }
  }, [activeBranchID, dateFrom, dateTo]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setReports([]);
        setLoading(false);
      }, 300);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    if (!searchQuery.trim()) return reports;
    return reports.filter(r => r.instructor_name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  };

  const filtered = getFilteredReports();
  const grandTotalClasses = filtered.reduce((acc, curr) => acc + curr.total_classes, 0);
  const grandTotalCommission = filtered.reduce((acc, curr) => acc + curr.total_commission, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nama Instruktur', 'Jumlah Sesi Kelas', 'Rate Fee Per Kelas', 'Total Komisi Diterima'];
    const data = filtered.map((r, idx) => [
      idx + 1,
      r.instructor_name,
      r.total_classes,
      r.rate_per_class,
      r.total_commission,
    ]);

    exportToExcel({
      filename: `Laporan_Komisi_Kelas_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKAPITULASI KOMISI KELAS INSTRUKTUR - PRABU GYM',
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
          body, .min-h-screen, main, #print-[#print-comm-area] {
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
            <h2 className="text-3xl font-heading text-slate-800 uppercase tracking-tight">LAPORAN KOMISI KELAS</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-accent">
              Rangkuman Honorarium & Komisi Mengajar Instruktur Kelas Aerobik / Zumba / Yoga / Kungfu
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
          searchPlaceholder="Cari nama instruktur kelas..."
          onExportExcel={handleExportExcel}
        >
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
        </SearchFilterBar>

        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden" id="print-comm-area">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center justify-between select-none">
            <span className="text-sm uppercase tracking-wider font-heading flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Rekapitulasi Insentif Mengajar Instruktur</span>
            </span>
            <span className="text-xs font-mono">Total Instruktur: {filtered.length}</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-4 border-r border-slate-350 w-12 text-center">No</th>
                    <th className="py-2.5 px-4 border-r border-slate-350">Nama Instruktur</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 text-center">Jumlah Sesi Kelas</th>
                    <th className="py-2.5 px-4 border-r border-slate-350 text-right">Fee Per Kelas</th>
                    <th className="py-2.5 px-4 text-right">Total Komisi Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {filtered.length > 0 ? (
                    filtered.map((r, idx) => (
                      <tr key={r.instructor_name} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center border-r border-slate-100 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border-r border-slate-100">{r.instructor_name}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-bold text-slate-800">{r.total_classes} Sesi Kelas</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-right font-mono text-slate-600">Rp. {r.rate_per_class.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">Rp. {r.total_commission.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        Tidak ada data komisi kelas.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-xs text-slate-700">
                      Grand Total Komisi
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{grandTotalClasses} Kelas</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#DC3545]">
                      Rp. {grandTotalCommission.toLocaleString('id-ID')}
                    </td>
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
