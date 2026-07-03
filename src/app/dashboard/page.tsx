'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface DashboardSummary {
  total_members: number;
  active_members: number;
  expired_members: number;
  new_this_month: number;
  checkins_today: number;
  sales_today: number;
}

interface Checkin {
  id: string;
  member_id: string;
  member_name: string;
  check_in_at: string;
  check_out_at?: string;
  duration_minutes?: number;
  status: string;
}

export default function SummaryPage() {
  const { activeBranchID } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchSummary();
    }
  }, [activeBranchID]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [sumRes, checkRes] = await Promise.all([
        api.get<DashboardSummary>(`/admin/dashboard/summary?branch_id=${activeBranchID}`),
        api.get<any>(`/admin/dashboard/checkins-today?branch_id=${activeBranchID}&per_page=10`),
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (checkRes.success && checkRes.data) {
        setTodayCheckins(checkRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Member', value: summary?.total_members || 0, icon: '👥', color: 'border-l-4 border-l-red-primary' },
    { label: 'Member Aktif', value: summary?.active_members || 0, icon: '✓', color: 'border-l-4 border-l-green-500' },
    { label: 'Member Expired', value: summary?.expired_members || 0, icon: '🚫', color: 'border-l-4 border-l-gray-600' },
    { label: 'Checkin Hari Ini', value: summary?.checkins_today || 0, icon: '🚀', color: 'border-l-4 border-l-pink-accent' },
    {
      label: 'Pendapatan Hari Ini',
      value: `Rp ${(summary?.sales_today || 0).toLocaleString('id-ID')}`,
      icon: '💵',
      color: 'border-l-4 border-l-yellow-500',
      colSpan: 'col-span-2 max-md:col-span-1',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading text-white">RINGKASAN OPERASIONAL</h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring Kehadiran, Membership & Transaksi Harian
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Sinkronisasi data summary...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`bg-black-card border border-gray-800 p-6 flex items-center justify-between angular-cut-sm relative ${
                  card.colSpan || ''
                } ${card.color}`}
              >
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-widest font-accent block">
                    {card.label}
                  </span>
                  <span className="text-3xl font-heading text-white mt-2 block">{card.value}</span>
                </div>
                <span className="text-4xl filter grayscale opacity-20">{card.icon}</span>
              </div>
            ))}
          </div>

          {/* Today Checkins Panel */}
          <div className="bg-black-card border border-gray-800 p-8 angular-cut">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h3 className="font-heading text-2xl text-white">KEHADIRAN HARI INI</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-accent mt-0.5">
                  Daftar check-in member di cabang terpilih
                </p>
              </div>
              <button
                onClick={fetchSummary}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-accent text-xs uppercase tracking-widest btn-clip transition-all"
              >
                Refresh Data ↻
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Nama Member</th>
                    <th className="py-3 px-4">Waktu Checkin</th>
                    <th className="py-3 px-4">Waktu Checkout</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {todayCheckins.length > 0 ? (
                    todayCheckins.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-800/10 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">{c.member_name}</td>
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
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Belum ada member yang checkin hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
