'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkinsApi } from '@/core/api';
import { Checkin } from '@/core/types';
import * as Icons from 'lucide-react';

export default function AllVisitsPage() {
  const { activeBranchID } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  
  // Default to today's date in YYYY-MM-DD format (local timezone)
  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());

  useEffect(() => {
    fetchCheckins();
  }, [activeBranchID, selectedDate]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      // Fetch checkins for the selected date with a high per_page to show all
      const res = await checkinsApi.list({
        branch_id: activeBranchID || undefined,
        date_from: selectedDate,
        date_to: selectedDate,
        per_page: 500,
        page: 1,
      });

      if (res.success && res.data) {
        setCheckins(res.data);
      } else {
        setCheckins([]);
      }
    } catch (err) {
      console.error('Error fetching checkins:', err);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckout = async (memberId: string) => {
    if (!confirm('Apakah Anda yakin ingin melakukan check-out member ini?')) return;
    
    setLoading(true);
    try {
      const res = await checkinsApi.checkout(memberId);
      if (res.success) {
        await fetchCheckins();
      } else {
        alert(res.error || 'Gagal melakukan check-out');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat check-out');
    } finally {
      setLoading(false);
    }
  };

  // Filter checkins into two lists
  // List Check In: active (not checked out yet)
  const checkinList = checkins.filter(c => !c.check_out_at);
  // List Check In - Check Out: completed (checked out)
  const completedList = checkins.filter(c => c.check_out_at);

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb */}
      <div className="bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500 rounded font-sans shadow-sm select-none">
        Kunjungan Anggota &nbsp;&gt;&nbsp; Daftar Kunjungan Anggota Semua Transaksi
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {/* Cyan Heading Title Bar */}
        <div className="bg-[#3bbbc8] px-6 py-4 flex items-center gap-2 text-white">
          <Icons.FileText className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-sans">Daftar Kunjungan Anggota</h2>
        </div>

        {/* Content Wrapper */}
        <div className="p-6 space-y-6">
          {/* Top Bar with red Kembali button & Date Picker */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer select-none"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            {/* Date Search/Filter Bar */}
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-xs font-bold select-none">Pencarian Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-350 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#3bbbc8] text-slate-800 font-mono shadow-sm cursor-pointer"
                onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
              />
            </div>
          </div>

          {/* Key-Value Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs text-slate-800">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold px-4 py-2.5 w-1/3 border border-slate-200 select-none">Tanggal Kunjungan</td>
                  <td className="px-4 py-2.5 border border-slate-200 bg-white font-mono font-semibold">
                    {new Date(selectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold px-4 py-2.5 border border-slate-200 select-none">Total Check In</td>
                  <td className="px-4 py-2.5 border border-slate-200 bg-white font-bold text-orange-600">{checkinList.length}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold px-4 py-2.5 border border-slate-200 select-none">Total Check in - Check Out</td>
                  <td className="px-4 py-2.5 border border-slate-200 bg-white font-bold text-emerald-600">{completedList.length}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* LIST CHECK IN (ACTIVE) */}
          <div className="space-y-3">
            <h3 className="text-slate-700 font-bold text-sm select-none border-b border-slate-200 pb-2">
              List Check In
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs text-slate-800">
                <thead>
                  <tr className="bg-[#4f709c] text-white text-left font-bold select-none">
                    <th className="py-2.5 px-3 border border-slate-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border border-slate-200">Nomor Anggota</th>
                    <th className="py-2.5 px-3 border border-slate-200">Nama Anggota</th>
                    <th className="py-2.5 px-3 border border-slate-200">Tanggal Check In</th>
                    <th className="py-2.5 px-3 border border-slate-200">Waktu Check In</th>
                    <th className="py-2.5 px-3 border border-slate-200">Tanggal Check Out</th>
                    <th className="py-2.5 px-3 border border-slate-200">Waktu Check Out</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {checkinList.length > 0 ? (
                    checkinList.map((c, index) => {
                      const checkInDate = new Date(c.check_in_at);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">{c.member_code || '-'}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-semibold">{c.member_name || '-'}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkInDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">-</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            <span className="text-orange-600 font-bold uppercase text-[9px] tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Dalam Club</span>
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleManualCheckout(c.member_id)}
                              disabled={loading}
                              className="px-2.5 py-1 bg-[#d9534f] hover:bg-[#c9302c] text-white text-[10px] font-bold uppercase tracking-wide rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Check Out
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 select-none">
                        TIDAK ADA ANGGOTA YANG SEDANG CHECK-IN.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LIST CHECK IN - CHECK OUT (COMPLETED) */}
          <div className="space-y-3">
            <h3 className="text-slate-700 font-bold text-sm select-none border-b border-slate-200 pb-2">
              List Check In - Check Out
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs text-slate-800">
                <thead>
                  <tr className="bg-[#4f709c] text-white text-left font-bold select-none">
                    <th className="py-2.5 px-3 border border-slate-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border border-slate-200">Nomor Anggota</th>
                    <th className="py-2.5 px-3 border border-slate-200">Nama Anggota</th>
                    <th className="py-2.5 px-3 border border-slate-200">Tanggal Check In</th>
                    <th className="py-2.5 px-3 border border-slate-200">Waktu Check In</th>
                    <th className="py-2.5 px-3 border border-slate-200">Tanggal Check Out</th>
                    <th className="py-2.5 px-3 border border-slate-200">Waktu Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {completedList.length > 0 ? (
                    completedList.map((c, index) => {
                      const checkInDate = new Date(c.check_in_at);
                      const checkOutDate = c.check_out_at ? new Date(c.check_out_at) : null;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">{c.member_code || '-'}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-semibold">{c.member_name || '-'}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkInDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkOutDate ? checkOutDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 font-mono">
                            {checkOutDate ? checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 select-none">
                        TIDAK ADA DATA KUNJUNGAN SELESAI PADA TANGGAL INI.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
