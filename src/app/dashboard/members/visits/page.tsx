'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkinsApi } from '@/core/api';
import { formatDateLabel, formatDateLong } from '@/core/constants';
import { Checkin } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { UserCheck, Clock, Search, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function CheckinsPage() {
  const { activeBranchID } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  // Search member state for visit tracking
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [perPage, setPerPage] = useState(50);

  useEffect(() => {
    if (activeBranchID) {
      fetchCheckins();
    }
  }, [activeBranchID, page, perPage, dateFrom, dateTo]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const res = await checkinsApi.list({
        branch_id: activeBranchID || undefined,
        page,
        date_from: dateFrom,
        date_to: dateTo,
        per_page: perPage
      });
      if (res.success && res.data) {
        setCheckins(res.data);
        setTotal(res.meta?.total || res.data.length);
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
    setSearchQuery('');
    setPage(1);
  };

  const getFilteredCheckins = () => {
    if (!debouncedSearch.trim()) return checkins;
    const q = debouncedSearch.toLowerCase().trim();
    return checkins.filter(c =>
      (c.member_name && c.member_name.toLowerCase().includes(q)) ||
      ((c as any).member_username && (c as any).member_username.toLowerCase().includes(q))
    );
  };

  const filteredCheckins = getFilteredCheckins();
  const searchedMemberName = debouncedSearch.trim() ? (filteredCheckins[0]?.member_name || debouncedSearch) : null;
  const totalMemberVisits = filteredCheckins.length;
  const totalCompletedVisits = filteredCheckins.filter(c => c.status !== 'active').length;

  // Columns definition for DataTable
  const columns: Column<Checkin>[] = [
    {
      key: 'date',
      header: 'Tanggal Sesi',
      className: 'font-bold text-slate-800 border-r border-slate-100',
      render: (c) => formatDateLong(c.check_in_at)
    },
    {
      key: 'member_name',
      header: 'Nama Member',
      className: 'font-semibold text-slate-800 border-r border-slate-100',
      render: (c) => (
        <div>
          <span>{c.member_name}</span>
          {(c as any).member_username && (
            <span className="text-[10px] text-slate-400 font-mono block">@{(c as any).member_username}</span>
          )}
        </div>
      )
    },
    {
      key: 'check_in',
      header: 'Check In',
      className: 'border-r border-slate-100',
      render: (c) => `${new Date(c.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    },
    {
      key: 'check_out',
      header: 'Check Out',
      className: 'border-r border-slate-100',
      render: (c) => c.check_out_at
        ? `${new Date(c.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
        : '-'
    },
    {
      key: 'duration',
      header: 'Durasi Sesi',
      className: 'border-r border-slate-100',
      render: (c) => c.duration_minutes !== undefined ? `${c.duration_minutes} Menit` : '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const isLatihan = c.status === 'active';
        return (
          <span
            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${isLatihan
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
          >
            {isLatihan ? 'LATIHAN' : 'SELESAI'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Log Presensi & Tracking Kunjungan Member"
        description="Pencarian & Tracking Total Kunjungan Anggota di Cabang Gym"
      />

      {/* Member Search & Date Filter Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          {/* Member Search Input */}
          <div className="flex-1 min-w-[280px]">
            <label className="block text-slate-500 text-[10px] uppercase tracking-wider font-accent mb-1.5 font-bold">
              Cari Nama / Nomor Anggota (Tracking Total Kunjungan)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama atau nomor anggota untuk tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:outline-none text-slate-800 pl-9 pr-3 py-2.5 text-xs rounded font-body"
              />
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-slate-500 text-[10px] uppercase tracking-wider font-accent mb-1.5 font-bold">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:outline-none text-slate-800 px-3 py-2 text-xs rounded font-mono cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] uppercase tracking-wider font-accent mb-1.5 font-bold">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:outline-none text-slate-800 px-3 py-2 text-xs rounded font-mono cursor-pointer"
              />
            </div>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-accent text-xs uppercase tracking-wider transition-all rounded cursor-pointer flex items-center gap-1 h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Member Visit Tracking Summary Panel */}
        {searchedMemberName && (
          <div className="bg-blue-50 border-l-4 border-[#007BFF] p-4 rounded flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#007BFF] text-white rounded-full flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-accent block">
                  Hasil Tracking Member
                </span>
                <span className="text-base font-extrabold text-slate-900 font-heading">
                  {searchedMemberName}
                </span>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Kunjungan</span>
                <span className="text-xl font-black font-mono text-[#007BFF]">{totalMemberVisits} Kali</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Kunjungan Selesai</span>
                <span className="text-xl font-black font-mono text-[#28A745]">{totalCompletedVisits} Kali</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        title={searchedMemberName ? `Riwayat Kunjungan: ${searchedMemberName}` : "Log Presensi Seluruh Member"}
        columns={columns}
        data={filteredCheckins}
        loading={loading}
        currentPage={page}
        totalItems={total}
        itemsPerPage={perPage}
        onPageChange={setPage}
        onItemsPerPageChange={(val) => {
          setPerPage(val);
          setPage(1);
        }}
        loadingMessage="Loading log presensi..."
        emptyMessage="Tidak ada data presensi untuk kata kunci / filter terpilih."
      />
    </div>
  );
}
