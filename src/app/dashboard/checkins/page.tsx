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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading text-white">LOG PRESENSI MEMBER</h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
          Riwayat Check-In & Check-Out di Cabang Gym
        </p>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-black-card border border-gray-800 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-accent mb-1.5">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-accent mb-1.5">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
          />
        </div>
        <button
          onClick={handleResetFilters}
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-accent text-xs uppercase tracking-widest btn-clip transition-all"
        >
          Reset Filter
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading log presensi...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Tanggal Sesi</th>
                  <th className="py-3 px-4">Nama Member</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Durasi Sesi</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {checkins.length > 0 ? (
                  checkins.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {new Date(c.check_in_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{c.member_name}</td>
                      <td className="py-3.5 px-4">
                        {new Date(c.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </td>
                      <td className="py-3.5 px-4">
                        {c.check_out_at
                          ? `${new Date(c.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.duration_minutes !== undefined ? `${c.duration_minutes} Menit` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold ${
                            c.status === 'active'
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {c.status === 'active' ? 'LATIHAN' : 'SELESAI'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Tidak ada data presensi untuk filter terpilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 text-xs">
              <span className="text-gray-500">Total {total} Sesi Kunjungan</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-accent uppercase tracking-widest"
                >
                  Prev
                </button>
                <button
                  disabled={page * 20 >= total}
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
