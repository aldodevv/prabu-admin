'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Employee {
  id: string;
  branch_id: string;
  branch_name: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  work_start_time?: string;
}

interface KaryawanCheckin {
  id: string;
  admin_name: string;
  check_in_at: string;
  check_out_at?: string;
  is_late: boolean;
}

export default function EmployeesCRUDPage() {
  const { activeBranchID, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form states (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('karyawan');
  const [workStartTime, setWorkStartTime] = useState('08:00:00');
  const [isActive, setIsActive] = useState(true);

  // Auto generated credentials popup state
  const [credDetails, setCredDetails] = useState<{ username: string; password?: string } | null>(null);

  // Employee Checkin History popup state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [checkins, setCheckins] = useState<KaryawanCheckin[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // Role guard: redirect if not owner
    if (user && user.role !== 'owner') {
      return;
    }

    if (activeBranchID) {
      fetchEmployees();
    }
  }, [activeBranchID, page, user]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/employees?branch_id=${activeBranchID}&page=${page}`
      );
      if (res.success && res.data) {
        setEmployees(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingID(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('karyawan');
    setWorkStartTime('08:00:00');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingID(emp.id);
    setFullName(emp.full_name);
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setRole(emp.role);
    setWorkStartTime(emp.work_start_time || '08:00:00');
    setIsActive(emp.is_active);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      full_name: fullName,
      email,
      phone,
      role,
      work_start_time: workStartTime,
    };

    try {
      if (editingID) {
        const res = await api.put(`/admin/employees/${editingID}`, {
          ...body,
          is_active: isActive,
        });
        if (res.success) {
          setIsFormOpen(false);
          fetchEmployees();
        }
      } else {
        const res = await api.post<any>('/admin/employees', {
          ...body,
          branch_id: activeBranchID,
        });
        if (res.success && res.data) {
          setIsFormOpen(false);
          setCredDetails({
            username: res.data.username,
            password: res.data.password,
          });
          fetchEmployees();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan akun karyawan ini?')) return;
    try {
      const res = await api.delete(`/admin/employees/${id}`);
      if (res.success) {
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewHistory = async (emp: Employee) => {
    setHistoryEmployee(emp);
    setIsHistoryOpen(true);
    setLoadingHistory(true);

    try {
      const res = await api.get<any>(`/admin/employees/${emp.id}/checkins?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        setCheckins(res.data);
      } else {
        setCheckins([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!user || user.role !== 'owner') {
    return <div className="text-red-primary font-accent uppercase text-xs">Akses Ditolak: Khusus Owner</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-white">KELOLA KARYAWAN</h2>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran & Kontrol Presensi Staff Admin Cabang Gym
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary hover:shadow-glow-red transition-all duration-300"
        >
          + DAFTAR KARYAWAN BARU
        </button>
      </div>

      {/* Cred Details dialog */}
      {credDetails && (
        <div className="bg-green-500/10 border border-green-500/30 p-6 angular-cut relative max-w-md animate-fade-in">
          <button onClick={() => setCredDetails(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
          <h4 className="text-green-500 font-heading text-lg mb-2">KREDENSIAL AKUN KARYAWAN</h4>
          <p className="text-gray-300 text-xs mb-4">Catat credentials berikut untuk diserahkan ke staff:</p>
          <div className="bg-black-deep/60 p-4 border border-gray-800 space-y-2 font-mono text-sm text-left">
            <div>
              <span className="text-gray-500 text-[10px] uppercase block">Username</span>
              <span className="text-white font-semibold">{credDetails.username}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase block">Password Sementara</span>
              <span className="text-red-primary font-semibold">{credDetails.password}</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-accent uppercase tracking-widest text-xs">
          Loading data karyawan...
        </div>
      ) : (
        <div className="bg-black-card border border-gray-800 p-8 angular-cut">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Nama Karyawan</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Jam Masuk Kerja</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {employees.length > 0 ? (
                  employees.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{e.full_name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">@{e.username}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-red-primary/20 px-2 py-0.5 text-red-primary">
                          {e.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>{e.email}</div>
                        <div className="text-gray-500">{e.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-white font-mono font-medium">{e.work_start_time || '08:00:00'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold ${
                            e.is_active
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {e.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewHistory(e)}
                            className="px-2.5 py-1.5 bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white font-accent text-[9px] uppercase tracking-wider transition-all border border-gray-800"
                          >
                            Presensi
                          </button>
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-accent text-[9px] uppercase tracking-wider transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="px-2.5 py-1.5 bg-red-primary/10 hover:bg-red-primary/20 text-red-primary font-accent text-[9px] uppercase tracking-wider transition-all"
                          >
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Belum ada karyawan terdaftar di cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-black-card border border-gray-800 p-8 angular-cut relative animate-fade-in">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-white mb-6">
              {editingID ? 'UBAH DATA KARYAWAN' : 'DAFTAR KARYAWAN BARU'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Role Panel
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  >
                    <option value="karyawan">Staff Karyawan</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Jam Masuk Shift (WIB)
                  </label>
                  <input
                    type="text"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all font-mono"
                    placeholder="08:00:00"
                    required
                  />
                </div>
              </div>

              {editingID && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status Keaktifan
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-black-deep border border-gray-800 focus:border-red-primary focus:outline-none text-white px-3 py-2 text-xs transition-all"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'MENYIMPAN...' : 'SIMPAN DATA STAFF'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Checkin History Modal */}
      {isHistoryOpen && historyEmployee && (
        <div className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-black-card border border-gray-800 p-8 angular-cut relative animate-fade-in">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-white mb-2">PRESENSI STAFF: {historyEmployee.full_name}</h3>
            <p className="text-gray-400 text-xs mb-6 uppercase tracking-wider font-accent">
              Jadwal Shift: {historyEmployee.work_start_time || '08:00:00'} WIB
            </p>

            {loadingHistory ? (
              <div className="text-center py-10 text-gray-500 font-accent uppercase tracking-widest text-xs">
                Membaca log absensi...
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[350px]">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs uppercase tracking-wider font-accent text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Check In</th>
                      <th className="py-2.5 px-3">Check Out</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40 text-xs">
                    {checkins.length > 0 ? (
                      checkins.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-800/10">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {new Date(c.check_in_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </td>
                          <td className="py-2.5 px-3">
                            {new Date(c.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </td>
                          <td className="py-2.5 px-3">
                            {c.check_out_at
                              ? `${new Date(c.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 text-[9px] font-accent uppercase tracking-widest font-semibold border ${
                                c.is_late
                                  ? 'bg-red-primary/10 text-red-primary border-red-primary/20'
                                  : 'bg-green-500/10 text-green-500 border-green-500/20'
                              }`}
                            >
                              {c.is_late ? 'TELAT' : 'TEPAT WAKTU'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">
                          Belum ada data presensi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
