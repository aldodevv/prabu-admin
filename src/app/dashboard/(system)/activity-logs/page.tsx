'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface ActivityLog {
  id: string;
  admin_name: string;
  action: string;
  entity_type?: string;
  description?: string;
  ip_address?: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const { activeBranchID, user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'owner') return;

    if (activeBranchID) {
      fetchLogs();
    }
  }, [activeBranchID, page, user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/activity-logs?branch_id=${activeBranchID}&page=${page}`
      );
      if (res.success && res.data) {
        setLogs(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'owner') {
    return <div className="text-red-primary font-accent uppercase text-xs">Akses Ditolak: Khusus Owner</div>;
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">AUDIT TRAIL AKTIVITAS</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring Log Aksi Staff Admin & Karyawan Secara Real-Time
        </p>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading audit logs...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Audit Trail Aktivitas</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Waktu Kejadian</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Pelaku</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Aksi / Event</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tipe Entitas</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Keterangan Aktivitas</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.length > 0 ? (
                    logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono border-r border-slate-100">
                          {new Date(l.created_at).toLocaleString('id-ID')} WIB
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-100">{l.admin_name}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-accent font-semibold bg-slate-100 text-[#DC3545] border border-[#DC3545]/10 rounded">
                            {l.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-accent uppercase tracking-wider text-slate-500 border-r border-slate-100">
                          {l.entity_type || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-[260px] leading-relaxed border-r border-slate-100">
                          {l.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{l.ip_address || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Belum ada catatan aktivitas admin di cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 50 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Total {total} Aksi Tercatat</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * 50 >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
