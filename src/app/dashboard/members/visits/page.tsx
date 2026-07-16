'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Checkin {
  id: string;
  member_id: string;
  member_name: string;
  check_in_at: string;
  check_out_at?: string;
  duration_minutes?: number;
  status: string;
}

export default function CheckinsPage() {
  const { activeBranchID } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchCheckins();
    }
  }, [activeBranchID, page, dateFrom, dateTo]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/checkins?branch_id=${activeBranchID}&page=${page}&date_from=${dateFrom}&date_to=${dateTo}`
      );
      if (res.success && res.data) {
        setCheckins(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">LOG PRESENSI MEMBER</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Riwayat Check-In & Check-Out di Cabang Gym
        </p>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-slate-500 text-[10px] uppercase tracking-wider font-accent mb-1.5">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3 py-2 text-xs transition-all rounded font-mono"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] uppercase tracking-wider font-accent mb-1.5">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3 py-2 text-xs transition-all rounded font-mono"
          />
        </div>
        <button
          onClick={handleResetFilters}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-accent text-xs uppercase tracking-widest transition-all rounded cursor-pointer"
        >
          Reset Filter
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading log presensi...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Log Presensi Member</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tanggal Sesi</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Member</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Check In</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Check Out</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Durasi Sesi</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {checkins.length > 0 ? (
                    checkins.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">
                          {new Date(c.check_in_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-100">{c.member_name}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          {new Date(c.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          {c.check_out_at
                            ? `${new Date(c.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          {c.duration_minutes !== undefined ? `${c.duration_minutes} Menit` : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                              c.status === 'active'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {c.status === 'active' ? 'LATIHAN' : 'SELESAI'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Tidak ada data presensi untuk filter terpilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Total {total} Sesi Kunjungan</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-accent uppercase tracking-widest rounded cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * 20 >= total}
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
