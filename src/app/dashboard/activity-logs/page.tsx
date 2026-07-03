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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading text-white">AUDIT TRAIL AKTIVITAS</h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring Log Aksi Staff Admin & Karyawan Secara Real-Time
        </p>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading audit logs...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Waktu Kejadian</th>
                  <th className="py-3 px-4">Nama Pelaku</th>
                  <th className="py-3 px-4">Aksi / Event</th>
                  <th className="py-3 px-4">Tipe Entitas</th>
                  <th className="py-3 px-4">Keterangan Aktivitas</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        {new Date(l.created_at).toLocaleString('id-ID')} WIB
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{l.admin_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-accent font-semibold bg-gray-800 text-red-primary border border-red-primary/10">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-accent uppercase tracking-wider text-gray-500">
                        {l.entity_type || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-[260px] leading-relaxed">
                        {l.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">{l.ip_address || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Belum ada catatan aktivitas admin di cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 text-xs">
              <span className="text-gray-500">Total {total} Aksi Tercatat</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Prev
                </button>
                <button
                  disabled={page * 50 >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
