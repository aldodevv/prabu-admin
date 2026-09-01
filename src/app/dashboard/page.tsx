'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { permissions } from '@/lib/permissions';
import { dashboardApi, membersApi } from '@/core/api';
import { formatDateLabel } from '@/core/constants';
import { Member } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { StatsCard } from '@/components/core/StatsCard';
import { DataTable, Column } from '@/components/core/DataTable';
import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';
import {
  TrendingUp,
  TrendingDown,
  UserCheck,
  Clock,
  Calendar,
  User,
  BarChart3,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

interface MonthlyOmzetItem {
  month_name: string;
  month_key: string;
  amount: number;
}

interface RevenueAnalytics {
  monthly_omzet: MonthlyOmzetItem[];
  current_month_sales: number;
  last_month_sales: number;
  month_growth_percent: number;
  current_year_sales: number;
  last_year_sales: number;
  year_growth_percent: number;
  total_transactions: number;
  average_tx_value: number;
  sales_by_duration_1m: number;
  sales_by_duration_3m: number;
  sales_by_duration_6m: number;
  sales_by_duration_12m: number;
}

interface DashboardSummary {
  total_members: number;
  active_members: number;
  expired_members: number;
  new_this_month: number;
  checkins_today: number;
  sales_today: number;
  checkouts_today: number;
  male_active: number;
  female_active: number;
  male_inactive: number;
  female_inactive: number;
  age_10_20: number;
  age_21_30: number;
  age_31_41: number;
  age_42_75: number;
  revenue_analytics?: RevenueAnalytics;
}

export default function SummaryPage() {
  const { user, activeBranchID, loading: authLoading } = useAuth();
  const router = useRouter();
  const canViewRevenue = permissions.canViewRevenueAnalytics(user?.role);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiringPerPage, setExpiringPerPage] = useState(50);
  const [totalExpiring, setTotalExpiring] = useState(0);
  const [loadingExpiring, setLoadingExpiring] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxType, setSelectedTxType] = useState<string>('all');
  const isInitialRevenueRef = useRef(true);

  useEffect(() => {
    setExpiringPage(1);
  }, [activeBranchID]);

  useEffect(() => {
    if (!authLoading && activeBranchID !== null) {
      fetchSummary();
      fetchExpiring(expiringPage, expiringPerPage);
    }
  }, [activeBranchID, expiringPage, expiringPerPage, authLoading]);

  useEffect(() => {
    if (!canViewRevenue) return;
    if (activeBranchID !== undefined) {
      if (isInitialRevenueRef.current) {
        isInitialRevenueRef.current = false;
        if (selectedTxType === 'all') return;
      }
      fetchRevenue(selectedTxType);
    }
  }, [selectedTxType, activeBranchID, canViewRevenue]);

  const fetchExpiring = async (page: number, perPage: number) => {
    if (!activeBranchID) return;
    setLoadingExpiring(true);
    try {
      const res = await membersApi.expiring({ branch_id: activeBranchID, page, per_page: perPage });
      if (res.success && res.data) {
        setExpiringMembers(res.data);
        if (res.meta) {
          setTotalExpiring(res.meta.total);
        }
      }
    } catch {
      setExpiringMembers([]);
    } finally {
      setLoadingExpiring(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await dashboardApi.summary(activeBranchID || '');
      if (res.success && res.data) {
        setSummary(res.data);
        if (canViewRevenue && res.data.revenue_analytics) {
          setRevenueAnalytics(res.data.revenue_analytics);
        } else {
          setRevenueAnalytics(null);
        }
      } else {
        if (res.error) setError(res.error);
        setSummary({
          total_members: 0,
          active_members: 0,
          expired_members: 0,
          new_this_month: 0,
          checkins_today: 0,
          sales_today: 0,
          checkouts_today: 0,
          male_active: 0,
          female_active: 0,
          male_inactive: 0,
          female_inactive: 0,
          age_10_20: 0,
          age_21_30: 0,
          age_31_41: 0,
          age_42_75: 0,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghubungi server untuk data dashboard');
      setSummary({
        total_members: 0,
        active_members: 0,
        expired_members: 0,
        new_this_month: 0,
        checkins_today: 0,
        sales_today: 0,
        checkouts_today: 0,
        male_active: 0,
        female_active: 0,
        male_inactive: 0,
        female_inactive: 0,
        age_10_20: 0,
        age_21_30: 0,
        age_31_41: 0,
        age_42_75: 0,
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchRevenue = async (txType: string) => {
    setLoadingRevenue(true);
    try {
      const res = await dashboardApi.revenueAnalytics(activeBranchID || '', txType);
      if (res.success && res.data) {
        setRevenueAnalytics(res.data);
      }
    } catch (err: any) {
      console.error('Gagal mengambil statistik omzet:', err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const today = new Date();
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loadingSummary || !summary) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-semibold">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#007BFF] rounded-full animate-spin" />
        <span>Sinkronisasi data summary...</span>
      </div>
    );
  }

  const columns: Column<Member>[] = [
    {
      key: 'no',
      header: 'No',
      align: 'center',
      className: 'text-slate-400 select-none w-12',
      render: (_, idx) => idx + 1
    },
    {
      key: 'membership_end',
      header: 'Masa Aktif',
      className: 'font-mono text-slate-500 select-none',
      render: (m) => formatDateLabel(m.membership_end)
    },
    {
      key: 'username',
      header: 'Nomor Anggota',
      className: 'font-mono text-slate-800'
    },
    {
      key: 'full_name',
      header: 'Nama Anggota',
      className: 'font-bold text-slate-800'
    },
    {
      key: 'phone',
      header: 'Kontak',
      className: 'font-mono text-slate-650',
      render: (m) => m.phone || '-'
    },
    {
      key: 'membership_type',
      header: 'Paket Fitnes',
      className: 'text-slate-600'
    },
    {
      key: 'days_remaining',
      header: 'Sisa Hari',
      align: 'center',
      className: 'select-none w-24',
      render: (m) => {
        const daysLeft = getDaysRemaining(m.membership_end);
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#007BFF] text-white font-mono font-black text-sm shadow-sm shadow-blue-500/10">
            {daysLeft}
          </span>
        );
      }
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      className: 'select-none w-28',
      render: (m) => (
        <button
          onClick={() => router.push(`/dashboard/transactions/member-payment?pay_member_id=${m.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#28A745] hover:bg-[#28A745] text-[#28A745] hover:text-white font-bold uppercase tracking-wider text-[10px] rounded transition-all duration-150 cursor-pointer shadow-sm shadow-green-500/5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Pembayaran</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Ringkasan Dashboard"
        description="Monitoring Data Keanggotaan & Kehadiran Cabang"
        action={
          <button
            onClick={fetchSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-55 text-slate-600 font-bold text-xs uppercase tracking-wider rounded shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        }
      />

      <FetchErrorAlert error={error} featureName="Ringkasan Dashboard" onRetry={fetchSummary} />

      {/* Row 1 Metrics (Blue, Green, Red) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 select-none">
        <StatsCard
          label="Total Anggota"
          value={summary.total_members}
          icon={TrendingUp}
          bg="bg-[#007BFF]"
        />
        <StatsCard
          label="Total Anggota Aktif"
          value={summary.active_members}
          icon={TrendingUp}
          bg="bg-[#28A745]"
        />
        <StatsCard
          label="Total Anggota Tidak Aktif"
          value={summary.expired_members}
          icon={TrendingDown}
          bg="bg-[#DC3545]"
        />
      </div>

      {/* Row 2 Metrics (Orange, Purple) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 select-none">
        <StatsCard
          label="Check In Hari Ini"
          value={summary.checkins_today}
          icon={UserCheck}
          bg="bg-[#FD7E14]"
          onViewMore={() => router.push('/dashboard/members/visits-all')}
        />
        <StatsCard
          label="Check In - Check Out Hari Ini"
          value={summary.checkouts_today}
          icon={Clock}
          bg="bg-[#6F42C1]"
          onViewMore={() => router.push('/dashboard/members/visits-all')}
        />
      </div>

      {/* 📊 STATISTIK OMZET 12 BULAN & REVENUE ANALYTICS */}
      <div className="space-y-4 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-accent flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#17A2B8]" />
            <span>Statistik Omzet 12 Bulan</span>
            {loadingRevenue && (
              <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-[#007BFF] rounded-full animate-spin ml-1" />
            )}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-accent">Filter Jenis Transaksi:</span>
            <select
              disabled={loadingRevenue}
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="bg-slate-50 hover:bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <option value="all">Semua Jenis Transaksi</option>
              <option value="anggota">Pendaftaran / Keanggotaan Anggota</option>
              <option value="pelatihan">Pelatihan (Personal Trainer / Sesi)</option>
              <option value="kelas">Rekap / Komisi Kelas</option>
              <option value="tunai">Transaksi Tunai / Penjualan Retail</option>
            </select>
          </div>
        </div>

        {revenueAnalytics && (
          <div className={`transition-opacity duration-200 space-y-4 ${loadingRevenue ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Bulan Ini vs Bulan Lalu */}
              <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-accent">Bulan Ini vs Lalu</span>
                  <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${revenueAnalytics.month_growth_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {revenueAnalytics.month_growth_percent >= 0 ? '+' : ''}
                    {revenueAnalytics.month_growth_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-black font-mono text-slate-800">
                    Rp. {revenueAnalytics.current_month_sales.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Bulan Lalu: Rp. {revenueAnalytics.last_month_sales.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* 2. Tahun Ini vs Tahun Lalu */}
              <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-accent">Tahun Ini vs Lalu</span>
                  <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${revenueAnalytics.year_growth_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {revenueAnalytics.year_growth_percent >= 0 ? '+' : ''}
                    {revenueAnalytics.year_growth_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-black font-mono text-slate-800">
                    Rp. {revenueAnalytics.current_year_sales.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Tahun Lalu: Rp. {revenueAnalytics.last_year_sales.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* 3. Jumlah Transaksi */}
              <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-accent">Jumlah Transaksi</span>
                <div className="mt-2">
                  <div className="text-xl font-black font-mono text-[#007BFF]">
                    {revenueAnalytics.total_transactions}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Total Transaksi Tercatat
                  </div>
                </div>
              </div>

              {/* 4. Average Transaction Value (ATV) */}
              <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-accent">Avg Transaction Value (ATV)</span>
                <div className="mt-2">
                  <div className="text-lg font-black font-mono text-[#28A745]">
                    Rp. {Math.round(revenueAnalytics.average_tx_value).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Rata-rata Nilai Transaksi
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Omzet Bar Chart */}
            <div className="bg-white border border-slate-200 p-5 rounded shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-heading">
                  📈 Grafik Omzet Bulanan (12 Bulan Terakhir)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Dalam Rupiah (Rp)</span>
              </div>

              <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 px-2 border-b border-slate-200">
                {revenueAnalytics.monthly_omzet.map((item, idx) => {
                  const maxAmount = Math.max(...revenueAnalytics.monthly_omzet.map(m => m.amount), 1);
                  const heightPercent = Math.max(Math.round((item.amount / maxAmount) * 100), 4);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-mono px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        {item.month_name}: Rp. {item.amount.toLocaleString('id-ID')}
                      </div>
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-brand-cyan hover:bg-[#138496] rounded-t transition-all duration-300 group-hover:scale-y-105 origin-bottom shadow-xs"
                      />
                      {/* X-axis Label */}
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate w-full text-center mt-1">
                        {item.month_name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Package Duration Breakdown Cards */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-accent block mb-3">
                  Omzet Berdasarkan Durasi Paket (1 / 3 / 6 / 12 Bulan)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Paket 1 Bulan', value: revenueAnalytics.sales_by_duration_1m, bg: 'border-l-4 border-blue-500' },
                    { label: 'Paket 3 Bulan', value: revenueAnalytics.sales_by_duration_3m, bg: 'border-l-4 border-teal-500' },
                    { label: 'Paket 6 Bulan', value: revenueAnalytics.sales_by_duration_6m, bg: 'border-l-4 border-amber-500' },
                    { label: 'Paket 12 Bulan', value: revenueAnalytics.sales_by_duration_12m, bg: 'border-l-4 border-emerald-500' },
                  ].map((p, i) => (
                    <div key={i} className={`bg-slate-50 border border-slate-200 p-3 rounded ${p.bg}`}>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">{p.label}</span>
                      <span className="text-sm font-black font-mono text-slate-800 mt-1 block">
                        Rp. {p.value.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3 (Gender Stats) - Light panels */}
      <div className="space-y-2 select-none">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-accent">
          Demografi Gender Anggota
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Anggota Laki-laki Aktif', value: summary.male_active, iconBg: 'bg-brand-cyan' },
            { label: 'Anggota Perempuan Aktif', value: summary.female_active, iconBg: 'bg-brand-cyan' },
            { label: 'Anggota Laki-laki Tidak Aktif', value: summary.male_inactive, iconBg: 'bg-[#DC3545]' },
            { label: 'Anggota Perempuan Tidak Aktif', value: summary.female_inactive, iconBg: 'bg-[#DC3545]' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex items-stretch min-w-0">
              <div className={`${item.iconBg} w-12 sm:w-14 flex items-center justify-center text-white shrink-0`}>
                <User className="w-5 h-5 sm:w-6 sm:h-6 fill-white/20" />
              </div>
              <div className="p-3 sm:p-3.5 flex flex-col justify-center min-w-0 flex-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-none font-accent truncate">
                  {item.label}
                </span>
                <span className="text-slate-400 text-[9px] font-bold uppercase mt-1 leading-none font-accent">
                  Jumlah Orang
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1 leading-none">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4 (Age Stats) - Light panels */}
      <div className="space-y-2 select-none">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-accent">
          Demografi Usia Anggota
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Anak-anak (10 - 20)', value: summary.age_10_20 },
            { label: 'Dewasa Muda (21 - 30)', value: summary.age_21_30 },
            { label: 'Dewasa (31 - 41)', value: summary.age_31_41 },
            { label: 'Orang Tua (42 - 75)', value: summary.age_42_75 }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex items-stretch min-w-0">
              <div className="bg-[#007BFF] w-12 sm:w-14 flex items-center justify-center text-white shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px]" />
              </div>
              <div className="p-3 sm:p-3.5 flex flex-col justify-center min-w-0 flex-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-none font-accent truncate">
                  {item.label}
                </span>
                <span className="text-slate-400 text-[9px] font-bold uppercase mt-1 leading-none font-accent">
                  Jumlah Orang
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1 leading-none">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Table - Member Expiration Data */}
      <DataTable
        title="Data Masa Aktif Anggota Bulan Ini"
        headerAction={<Calendar className="w-4 h-4 text-white/80" />}
        columns={columns}
        data={expiringMembers}
        loading={loadingExpiring}
        currentPage={expiringPage}
        totalItems={totalExpiring}
        itemsPerPage={expiringPerPage}
        onPageChange={setExpiringPage}
        onItemsPerPageChange={(val) => {
          setExpiringPerPage(val);
          setExpiringPage(1);
        }}
        emptyMessage="Tidak ada member yang masa aktifnya habis bulan ini."
      />
    </div>
  );
}
