'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Member {
  id: string;
  branch_id: string;
  branch_name: string;
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
}

export default function MembersPanel() {
  const { activeBranchID } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [membershipType, setMembershipType] = useState('gym');
  const [membershipStart, setMembershipStart] = useState('');
  const [membershipEnd, setMembershipEnd] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Success dialog (to show auto-generated credentials)
  const [credDetails, setCredDetails] = useState<{ username: string; password?: string } | null>(null);

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
    }
  }, [activeBranchID, page, search]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/admin/members?branch_id=${activeBranchID}&page=${page}&search=${search}`
      );
      if (res.success && res.data) {
        setMembers(res.data);
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
    setAddress('');
    setDateOfBirth('');
    setGender('Laki-laki');
    setMembershipType('gym');
    
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    setMembershipStart(today);
    setMembershipEnd(nextMonthStr);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingID(m.id);
    setFullName(m.full_name);
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setAddress(m.address || '');
    setDateOfBirth(m.date_of_birth || '');
    setGender(m.gender || 'Laki-laki');
    setMembershipType(m.membership_type);
    setMembershipStart(m.membership_start);
    setMembershipEnd(m.membership_end);
    setIsActive(m.is_active);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: any = {
      full_name: fullName,
      email,
      phone,
      address,
      date_of_birth: dateOfBirth,
      gender,
      membership_type: membershipType,
      membership_start: membershipStart,
      membership_end: membershipEnd,
    };

    try {
      if (editingID) {
        body.is_active = isActive;
        const res = await api.put<any>(`/admin/members/${editingID}`, body);
        if (res.success) {
          setIsFormOpen(false);
          fetchMembers();
        }
      } else {
        body.branch_id = activeBranchID;
        const res = await api.post<any>('/admin/members', body);
        if (res.success && res.data) {
          setIsFormOpen(false);
          setCredDetails({
            username: res.data.username,
            password: res.data.password,
          });
          fetchMembers();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan member ini?')) return;
    try {
      const res = await api.delete(`/admin/members/${id}`);
      if (res.success) {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">KELOLA MEMBER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran & Modifikasi Profil Keanggotaan Gym
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + DAFTAR MEMBER BARU
        </button>
      </div>

      {/* Cred Details dialog */}
      {credDetails && (
        <div className="bg-emerald-50 border border-emerald-250 p-6 rounded relative max-w-md animate-fade-in text-emerald-800">
          <button onClick={() => setCredDetails(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer">✕</button>
          <h4 className="text-emerald-800 font-heading text-lg mb-2">KREDENSIAL MEMBER BARU</h4>
          <p className="text-slate-600 text-xs mb-4">Catat username dan password berikut untuk diberikan kepada member:</p>
          <div className="bg-white border border-emerald-200 p-4 space-y-2 font-mono text-sm text-left rounded">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Username</span>
              <span className="text-slate-800 font-semibold">{credDetails.username}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Password Sementara</span>
              <span className="text-red-600 font-semibold">{credDetails.password}</span>
            </div>
            <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-100 mt-4">
              <span className="text-slate-400 text-[10px] uppercase block mb-2 font-accent font-bold">QR Code Absensi</span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(credDetails.username)}`}
                alt="QR Code Member"
                className="w-32 h-32 border border-slate-200 p-1.5 bg-white rounded shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
          <span className="text-sm uppercase tracking-wider">Search One Club</span>
        </div>
        <div className="p-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, username atau email..."
            className="w-full max-w-md bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#DC3545] text-slate-800 px-4 py-2.5 text-sm transition-all rounded font-body"
          />
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading data member...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Daftar Anggota One Club</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Lengkap</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Username</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Kontak</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Mulai / Berakhir</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Tipe</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {members.length > 0 ? (
                    members.map((m) => {
                      const isExpired = new Date(m.membership_end) < new Date();
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{m.full_name}</td>
                          <td className="py-3.5 px-4 font-mono text-xs border-r border-slate-100">@{m.username}</td>
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <div className="text-xs">{m.email}</div>
                            <div className="text-xs text-slate-500">{m.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs border-r border-slate-100">
                            <div>{m.membership_start}</div>
                            <div className="text-slate-500">{m.membership_end}</div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="text-[10px] font-accent uppercase tracking-widest font-semibold border border-[#17A2B8]/20 px-2 py-0.5 text-[#17A2B8] rounded">
                              {m.membership_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border rounded ${
                                !m.is_active
                                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                                  : isExpired
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {!m.is_active ? 'NONAKTIF' : isExpired ? 'EXPIRED' : 'AKTIF'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="px-3 py-1.5 border border-[#17A2B8] hover:bg-[#17A2B8] text-[#17A2B8] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="px-3 py-1.5 border border-[#DC3545] hover:bg-[#DC3545] text-[#DC3545] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold select-none">
                        Tidak ada data member ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Total {total} Member</span>
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

      {/* Create/Edit Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-2xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              {editingID ? 'EDIT PROFILE MEMBER' : 'DAFTAR MEMBER BARU'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              {editingID && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded mb-4">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2 font-accent">QR Code Presensi Member</span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(members.find(m => m.id === editingID)?.username || '')}`}
                    alt="QR Code Member"
                    className="w-32 h-32 border border-slate-200 p-1 bg-white rounded shadow-sm"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Username: @{members.find(m => m.id === editingID)?.username}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Membership Tipe
                  </label>
                  <select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="gym">GYM (Rp 150k)</option>
                    <option value="aerobik">AEROBIK (Rp 200k)</option>
                    <option value="kungfu">KUNGFU (Rp 250k)</option>
                    <option value="pilates">PILATES (Rp 350k)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Status
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={membershipStart}
                    onChange={(e) => setMembershipStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    value={membershipEnd}
                    onChange={(e) => setMembershipEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Alamat Rumah
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all h-20 resize-none rounded"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'MENYIMPAN...' : 'SIMPAN DATA MEMBER'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
