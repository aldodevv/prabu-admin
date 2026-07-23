'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkinsApi } from '@/core/api';
import { formatDateLabel, formatDateLong } from '@/core/constants';
import { Checkin } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';

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
      const res = await checkinsApi.list({
        branch_id: activeBranchID || undefined,
        page,
        date_from: dateFrom,
        date_to: dateTo,
        per_page: 20
      });
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
      className: 'font-semibold text-slate-800 border-r border-slate-100'
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
            className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
              isLatihan
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
    <div className="space-y-8 font-sans">
      <PageHeader 
        title="Log Presensi Member" 
        description="Riwayat Check-In & Check-Out di Cabang Gym" 
      />

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
            className="bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3 py-2 text-xs transition-all rounded font-mono cursor-pointer"
            onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
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
            className="bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-800 px-3 py-2 text-xs transition-all rounded font-mono cursor-pointer"
            onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
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
      <DataTable
        title="Log Presensi Member"
        columns={columns}
        data={checkins}
        loading={loading}
        loadingMessage="Loading log presensi..."
        emptyMessage="Tidak ada data presensi untuk filter terpilih."
        currentPage={page}
        totalItems={total}
        itemsPerPage={20}
        onPageChange={setPage}
      />
    </div>
  );
}
