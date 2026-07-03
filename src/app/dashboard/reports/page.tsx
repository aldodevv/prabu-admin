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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading text-white">LAPORAN & SARAN MEMBER</h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring Kritik, Pengaduan Fasilitas & Feedback Keanggotaan Gym
        </p>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading feedback member...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Nama Member</th>
                  <th className="py-3 px-4">Subjek</th>
                  <th className="py-3 px-4">Isi Pengaduan</th>
                  <th className="py-3 px-4">Tanggal Masuk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {reports.length > 0 ? (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{r.member_name}</td>
                      <td className="py-3.5 px-4 font-accent text-xs uppercase tracking-wider text-red-primary">
                        {r.subject}
                      </td>
                      <td className="py-3.5 px-4 text-xs leading-relaxed max-w-[280px]">
                        {r.description}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold ${
                            r.status === 'pending'
                              ? 'bg-red-primary/10 text-red-primary border border-red-primary/20'
                              : r.status === 'reviewed'
                              ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              : 'bg-green-500/10 text-green-500 border border-green-500/20'
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
                              className="px-2.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-accent text-[9px] uppercase tracking-wider transition-all border border-yellow-500/20"
                            >
                              Tinjau
                            </button>
                          )}
                          {r.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'resolved')}
                              className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 font-accent text-[9px] uppercase tracking-wider transition-all border border-green-500/20"
                            >
                              Selesaikan
                            </button>
                          )}
                          {r.status === 'resolved' && (
                            <span className="text-[10px] text-gray-500 uppercase font-accent">SELESAI ✓</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Belum ada laporan dari member di cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
