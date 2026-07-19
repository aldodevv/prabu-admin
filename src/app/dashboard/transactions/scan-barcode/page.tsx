'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { checkinsApi } from '@/core/api';
import * as Icons from 'lucide-react';

interface MemberData {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type: string;
  membership_start: string;
  membership_end: string;
  is_active: boolean;
  photo_url?: string;
}

interface EmployeeData {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  work_start_time?: string;
}

interface MemberCheckin {
  id: string;
  check_in_at: string;
  check_out_at?: string;
  branch_name: string;
  duration_minutes?: number;
}

interface EmployeeCheckin {
  id: string;
  admin_name: string;
  check_in_at: string;
  check_out_at?: string;
  is_late: boolean;
}

interface HealthMetrics {
  total_minutes_today: number;
  average_minutes_week: number;
  level: string;
}

interface ScanResponse {
  type: 'member' | 'employee';
  data: MemberData | EmployeeData;
  checkins?: (MemberCheckin | EmployeeCheckin)[];
  health?: HealthMetrics;
}

export default function ScanBarcodePage() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep focus on the barcode field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScanSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get<ScanResponse>(`/admin/scan-barcode?code=${encodeURIComponent(barcode.trim())}`);
      if (res.success && res.data) {
        setResult(res.data);
        setBarcode(''); // Reset input for next scan
      } else {
        setErrorMsg(res.error || 'Data barcode tidak ditemukan.');
        setResult(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memverifikasi barcode.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reloadMemberData = async (code: string) => {
    try {
      const res = await api.get<ScanResponse>(`/admin/scan-barcode?code=${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckin = async (memberId: string) => {
    if (!result || result.type !== 'member') return;
    const member = result.data as MemberData;
    
    setLoading(true);
    try {
      const res = await checkinsApi.checkin(memberId);
      if (res.success) {
        await reloadMemberData(member.username);
      } else {
        alert(res.error || 'Gagal melakukan check-in');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (memberId: string) => {
    if (!result || result.type !== 'member') return;
    const member = result.data as MemberData;

    setLoading(true);
    try {
      const res = await checkinsApi.checkout(memberId);
      if (res.success) {
        await reloadMemberData(member.username);
      } else {
        alert(res.error || 'Gagal melakukan check-out');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat check-out');
    } finally {
      setLoading(false);
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
    return diffDays;
  };

  const getMemberStatusText = (endDateStr: string) => {
    const daysLeft = getDaysRemaining(endDateStr);
    return daysLeft >= 0 ? 'Aktif' : 'Tidak Aktif';
  };

  // Find if there is an active checkin (no checkout time)
  const activeCheckin = result?.type === 'member' 
    ? (result.checkins as MemberCheckin[])?.find(c => !c.check_out_at)
    : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb path */}
      <div className="bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500 rounded font-sans shadow-sm select-none">
        Transaksi Fitnes &nbsp;&gt;&nbsp; Scan Barcode
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {/* Cyan Heading Title Bar */}
        <div className="bg-[#3bbbc8] px-6 py-4 flex items-center gap-2 text-white">
          <Icons.Search className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-sans">Scan Barcode</h2>
        </div>

        {/* Panel Content */}
        <div className="p-6 space-y-6">
          {/* Scanner Input Form */}
          <form onSubmit={handleScanSearch} className="flex gap-2 max-w-xl">
            <input
              ref={inputRef}
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Masukkan Kode Barcode di sini..."
              className="flex-1 bg-slate-50 border border-slate-350 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3bbbc8] text-slate-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#3bbbc8] hover:bg-[#31a5b0] text-white text-xs font-bold rounded flex items-center justify-center transition-colors cursor-pointer disabled:opacity-55"
            >
              <Icons.Search className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-55 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider rounded">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Result Panel */}
          {result && (
            <div className="space-y-6">
              {/* Warning/Info Banner */}
              {result.type === 'member' && (() => {
                const member = result.data as MemberData;
                const daysLeft = getDaysRemaining(member.membership_end);
                if (daysLeft >= 0 && daysLeft <= 7) {
                  return (
                    <div className="w-full bg-[#d9edf7] border border-[#bce8f1] text-[#31708f] px-4 py-6 rounded text-center relative font-sans text-2xl font-bold uppercase tracking-wider select-none">
                      MASA AKTIF TINGGAL {daysLeft} HARI
                      <button 
                        type="button" 
                        onClick={() => setResult(null)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#31708f] opacity-50 hover:opacity-100 text-lg cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  );
                } else if (daysLeft < 0) {
                  return (
                    <div className="w-full bg-red-100 border border-red-200 text-red-700 px-4 py-6 rounded text-center relative font-sans text-2xl font-bold uppercase tracking-wider select-none">
                      MEMBERSHIP EXPIRED (LEWAT {Math.abs(daysLeft)} HARI)
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <h3 className="text-slate-700 font-bold text-base mb-4 font-sans border-b border-slate-200 pb-2">
                  Data {result.type === 'member' ? 'Anggota' : 'Karyawan'}
                </h3>

                <div className="grid grid-cols-[1fr_2fr] gap-6 max-md:grid-cols-1">
                  {/* Left Column: Avatar Photo Placeholder */}
                  <div>
                    <div className="w-full bg-[#4A4A4A] aspect-[4/3] flex items-center justify-center rounded overflow-hidden border border-slate-200">
                      {result.type === 'member' && (result.data as MemberData).photo_url ? (
                        <img 
                          src={(result.data as MemberData).photo_url} 
                          alt={result.data.full_name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <svg className="w-32 h-32 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Member Profile Details Table */}
                  <div>
                    {result.type === 'member' ? (
                      (() => {
                        const member = result.data as MemberData;
                        const daysLeft = getDaysRemaining(member.membership_end);
                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-200 text-xs">
                              <tbody>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 w-1/3 border border-slate-200 select-none">Nomor Anggota</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono">{member.username}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Nama Anggota</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-semibold">{member.full_name}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Tanggal Lahir</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono">
                                    {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}
                                  </td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Paket Anggota</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white">{member.membership_type}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Masa Aktif</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono">
                                    {member.membership_start ? new Date(member.membership_start).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'} s/d {member.membership_end ? new Date(member.membership_end).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}
                                  </td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Sisa Hari</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono font-bold">
                                    {daysLeft >= 0 ? `${daysLeft} hari` : 'Expired'}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Status Anggota</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-semibold">
                                    {getMemberStatusText(member.membership_end)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    ) : (
                      // Employee view
                      (() => {
                        const emp = result.data as EmployeeData;
                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-200 text-xs">
                              <tbody>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 w-1/3 border border-slate-200 select-none">Nama Lengkap</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white">{emp.full_name}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Role</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-bold text-red-650">{emp.role.toUpperCase()}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Username</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono">@{emp.username}</td>
                                </tr>
                                <tr>
                                  <td className="bg-[#4f709c] text-white font-bold px-4 py-2 border border-slate-200 select-none">Jam Shift</td>
                                  <td className="text-slate-800 px-4 py-2 border border-slate-200 bg-white font-mono">{emp.work_start_time || '08:00'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Check In Action & Logs Panel */}
              {result.type === 'member' && (
                <div className="space-y-4">
                  <h3 className="text-slate-700 font-bold text-base border-b border-slate-200 pb-2 select-none">
                    Check In Anggota Bulan Ini ({(result.data as MemberData).username})
                  </h3>

                  {/* Manual Checkin/Checkout Action Button */}
                  <div>
                    {activeCheckin ? (
                      <button
                        type="button"
                        onClick={() => handleCheckout(result.data.id)}
                        disabled={loading}
                        className="px-4 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Icons.LogOut className="w-4 h-4" />
                        <span>Check Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckin(result.data.id)}
                        disabled={loading}
                        className="px-4 py-2.5 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Icons.LogIn className="w-4 h-4" />
                        <span>Check In</span>
                      </button>
                    )}
                  </div>

                  {/* Visit Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-200 text-xs text-slate-800">
                      <thead>
                        <tr className="bg-[#4f709c] text-white text-left font-bold select-none">
                          <th className="py-2.5 px-3 border border-slate-200 w-12 text-center">No</th>
                          <th className="py-2.5 px-3 border border-slate-200">Tanggal Check In</th>
                          <th className="py-2.5 px-3 border border-slate-200">Waktu Check In</th>
                          <th className="py-2.5 px-3 border border-slate-200">Tanggal Check Out</th>
                          <th className="py-2.5 px-3 border border-slate-200">Waktu Check Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {result.checkins && result.checkins.length > 0 ? (
                          (result.checkins as MemberCheckin[]).map((c, index) => {
                            const checkInDate = new Date(c.check_in_at);
                            const checkOutDate = c.check_out_at ? new Date(c.check_out_at) : null;
                            return (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">{index + 1}</td>
                                <td className="py-2.5 px-3 border border-slate-200 font-mono">
                                  {checkInDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 font-mono">
                                  {checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 font-mono">
                                  {checkOutDate 
                                    ? checkOutDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') 
                                    : '-'}
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 font-mono">
                                  {checkOutDate 
                                    ? checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
                                    : <span className="text-orange-600 font-bold uppercase text-[9px] tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Dalam Club</span>}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 select-none">
                              BELUM ADA DATA PRESENSI KUNJUNGAN.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
