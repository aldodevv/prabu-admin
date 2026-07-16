'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Report {
  id: string;
  member_name: string;
  subject: string;
  description: string;
  status: string; // "pending", "reviewed", "resolved"
  created_at: string;
}

export default function ReportsPanel() {
  const { activeBranchID } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchReports();
    }
  }, [activeBranchID]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/admin/reports?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/admin/reports/${id}/status`, {
        status: newStatus,
      });
      if (res.success) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">LAPORAN & SARAN MEMBER</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring Kritik, Pengaduan Fasilitas & Feedback Keanggotaan Gym
        </p>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading feedback member...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Laporan & Saran Member</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Member</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Subjek</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Isi Pengaduan</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tanggal Masuk</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reports.length > 0 ? (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{r.member_name}</td>
                        <td className="py-3.5 px-4 font-accent text-xs uppercase tracking-wider text-red-600 border-r border-slate-100">
                          {r.subject}
                        </td>
                        <td className="py-3.5 px-4 text-xs leading-relaxed max-w-[280px] border-r border-slate-100">
                          {r.description}
                        </td>
                        <td className="py-3.5 px-4 text-xs border-r border-slate-100">
                          {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                              r.status === 'pending'
                                ? 'bg-red-50 text-red-750 border-red-200'
                                : r.status === 'reviewed'
                                ? 'bg-yellow-50 text-yellow-750 border-yellow-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {r.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'reviewed')}
                                className="px-2.5 py-1.5 border border-yellow-500 hover:bg-yellow-500 text-yellow-600 hover:text-white font-accent text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Tinjau
                              </button>
                            )}
                            {r.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'resolved')}
                                className="px-2.5 py-1.5 border border-emerald-600 hover:bg-emerald-600 text-emerald-700 hover:text-white font-accent text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Selesaikan
                              </button>
                            )}
                            {r.status === 'resolved' && (
                              <span className="text-[10px] text-slate-400 uppercase font-accent font-bold">SELESAI ✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Belum ada laporan dari member di cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
