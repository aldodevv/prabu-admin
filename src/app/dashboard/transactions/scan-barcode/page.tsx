'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';

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

  const handleScanSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.get<ScanResponse>(`/admin/scan-barcode?code=${encodeURIComponent(barcode.trim())}`);
      if (res.success && res.data) {
        setResult(res.data);
        setBarcode(''); // Reset input for next scan
      } else {
        setErrorMsg(res.error || 'Data barcode tidak ditemukan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memverifikasi barcode.');
    } finally {
      setLoading(false);
    }
  };

  const getMembershipStatus = (endStr: string) => {
    const end = new Date(endStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) return { label: 'Expired', style: 'bg-red-100 text-red-800' };
    return { label: 'Aktif', style: 'bg-emerald-105 text-emerald-800' };
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">SCAN BARCODE</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Scan QR / Barcode member atau kartu karyawan untuk melihat profil & data kehadiran
        </p>
      </div>

      {/* Scanner Input Panel */}
      <div className="bg-white border border-slate-200 p-8 max-w-2xl rounded shadow-sm">
        <form onSubmit={handleScanSearch} className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Arahkan Barcode Scanner / Masukkan Kode Barcode di sini..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#DC3545] font-mono tracking-wider text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'MENCARI...' : 'CARI'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider max-w-2xl animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 animate-fadeIn">
          {/* Left Panel: Profile Detail */}
          <div className="bg-white border border-slate-200 p-8 h-fit rounded shadow-sm">
            <h3 className="font-heading text-lg text-slate-800 mb-6 uppercase tracking-wider border-b border-slate-100 pb-3">
              Profil {result.type === 'member' ? 'Member' : 'Karyawan'}
            </h3>

            {result.type === 'member' ? (
              // Member detail UI
              (() => {
                const member = result.data as MemberData;
                const status = getMembershipStatus(member.membership_end);
                return (
                  <div className="space-y-6">
                    {member.photo_url && (
                      <div className="flex justify-center">
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-32 h-32 rounded-full object-cover border-2 border-slate-200"
                        />
                      </div>
                    )}
                    <div className="space-y-3.5 text-xs text-slate-650">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Lengkap</span>
                        <span className="text-sm font-bold text-slate-800">{member.full_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Username</span>
                          <span className="font-medium text-slate-800">@{member.username}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ID Member</span>
                          <span className="font-mono text-slate-700 truncate block">{member.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Membership</span>
                        <span className={`inline-flex px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider ${status.style}`}>
                          {status.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Masa Berlaku</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(member.membership_start).toLocaleDateString('id-ID')} s/d {new Date(member.membership_end).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nomor HP</span>
                          <span className="font-mono text-slate-800">{member.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email</span>
                          <span className="text-slate-850">{member.email || '-'}</span>
                        </div>
                      </div>
                      {result.health && (
                        <div className="bg-slate-50 p-3.5 border border-slate-200 rounded">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Metrik Latihan Minggu Ini</h4>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 font-semibold block">Rata-rata Durasi</span>
                              <span className="font-bold text-slate-800">{Math.round(result.health.average_minutes_week)} Menit</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Level Latihan</span>
                              <span className="font-bold text-[#DC3545] uppercase">{result.health.level}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              // Employee detail UI
              (() => {
                const emp = result.data as EmployeeData;
                return (
                  <div className="space-y-4 text-xs text-slate-650">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Lengkap</span>
                      <span className="text-sm font-bold text-slate-800">{emp.full_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role</span>
                        <span className="font-bold text-[#DC3545] uppercase">{emp.role}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ID Karyawan</span>
                        <span className="font-mono text-slate-700 block truncate">{emp.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Username</span>
                      <span className="font-medium text-slate-800">@{emp.username}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jam Masuk Shift</span>
                      <span className="font-mono font-semibold text-slate-800">{emp.work_start_time || '08:00'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nomor HP</span>
                      <span className="font-mono text-slate-800">{emp.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email</span>
                      <span className="text-slate-850">{emp.email || '-'}</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Right Panel: Check-in Log History */}
          <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
            <h3 className="font-heading text-lg text-slate-800 mb-6 uppercase tracking-wider border-b border-slate-100 pb-3">
              Riwayat Kunjungan / Absensi (10 Terakhir)
            </h3>

            <div className="overflow-x-auto">
              {result.checkins && result.checkins.length > 0 ? (
                result.type === 'member' ? (
                  <table className="w-full text-left text-xs text-slate-650">
                    <thead className="text-[10px] uppercase font-accent text-slate-400 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 border-r border-slate-200/50">Tanggal Check-In</th>
                        <th className="py-2.5 px-4 border-r border-slate-200/50">Tanggal Check-Out</th>
                        <th className="py-2.5 px-4 border-r border-slate-200/50">Cabang</th>
                        <th className="py-2.5 px-4 text-right">Durasi Latihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(result.checkins as MemberCheckin[]).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-800 border-r border-slate-100">
                            {new Date(c.check_in_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 border-r border-slate-100">
                            {c.check_out_at
                              ? new Date(c.check_out_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                              : <span className="text-orange-500 font-bold uppercase text-[9px] tracking-wider bg-orange-50 px-1.5 py-0.5 rounded">Dalam Club</span>}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-600">{c.branch_name}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {c.duration_minutes ? `${c.duration_minutes} Menit` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs text-slate-650">
                    <thead className="text-[10px] uppercase font-accent text-slate-400 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 border-r border-slate-200/50">Jam Presensi Masuk</th>
                        <th className="py-2.5 px-4 border-r border-slate-200/50">Jam Presensi Pulang</th>
                        <th className="py-2.5 px-4">Status Keterlambatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(result.checkins as EmployeeCheckin[]).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-800 border-r border-slate-100">
                            {new Date(c.check_in_at).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 border-r border-slate-100">
                            {c.check_out_at ? new Date(c.check_out_at).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                c.is_late
                                  ? 'bg-red-55 text-red-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {c.is_late ? 'Terlambat' : 'Tepat Waktu'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                <div className="text-center py-10 text-slate-400 text-[11px] uppercase tracking-wider font-accent">
                  Belum ada log riwayat kunjungan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
