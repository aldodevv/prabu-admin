'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Trainer {
  id: string;
  branch_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  gender?: string;
  is_active: boolean;
}

export default function TrainersCRUDPage() {
  const { activeBranchID } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchTrainers();
    }
  }, [activeBranchID]);

  const fetchTrainers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get<any>(`/admin/trainers?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        setTrainers(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memuat daftar trainer.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingID(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setGender('Laki-laki');
    setIsActive(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Trainer) => {
    setEditingID(t.id);
    setFullName(t.full_name);
    setEmail(t.email || '');
    setPhone(t.phone || '');
    setGender(t.gender || 'Laki-laki');
    setIsActive(t.is_active);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }

    const body = {
      branch_id: activeBranchID,
      full_name: fullName,
      email,
      phone,
      gender,
      is_active: isActive,
    };

    try {
      if (editingID) {
        // Update
        const res = await api.put(`/admin/trainers/${editingID}`, body);
        if (res.success) {
          setSuccessMsg('Data trainer berhasil diperbarui');
          setIsFormOpen(false);
          fetchTrainers();
        } else {
          setErrorMsg(res.error || 'Gagal memperbarui data trainer');
        }
      } else {
        // Create
        const res = await api.post('/admin/trainers', body);
        if (res.success) {
          setSuccessMsg('Trainer baru berhasil ditambahkan');
          setIsFormOpen(false);
          fetchTrainers();
        } else {
          setErrorMsg(res.error || 'Gagal menambahkan trainer baru');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan trainer ini?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/admin/trainers/${id}`);
      if (res.success) {
        setSuccessMsg('Trainer berhasil dinonaktifkan');
        fetchTrainers();
      } else {
        setErrorMsg(res.error || 'Gagal menonaktifkan trainer');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">KELOLA TRAINER / PELATIH</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran & Modifikasi Profil Trainer Cabang Gym
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center font-accent font-bold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white transition-all rounded shadow-sm cursor-pointer"
        >
          + Tambah Trainer
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold uppercase tracking-wider animate-fadeIn">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-bold uppercase tracking-wider animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Memuat data pelatih...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Daftar Trainer / Pelatih</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-5 border-r border-slate-300/40">Nama Lengkap</th>
                    <th className="py-3 px-5 border-r border-slate-300/40">Jenis Kelamin</th>
                    <th className="py-3 px-5 border-r border-slate-300/40">Nomor HP</th>
                    <th className="py-3 px-5 border-r border-slate-300/40">Email</th>
                    <th className="py-3 px-5 border-r border-slate-300/40">Status</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {trainers.length > 0 ? (
                    trainers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-800 border-r border-slate-100">{t.full_name}</td>
                        <td className="py-4 px-5 border-r border-slate-100">{t.gender || '-'}</td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-650 border-r border-slate-100">{t.phone || '-'}</td>
                        <td className="py-4 px-5 text-slate-600 border-r border-slate-100">{t.email || '-'}</td>
                        <td className="py-4 px-5 border-r border-slate-100">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-accent uppercase tracking-widest font-semibold border ${
                              t.is_active
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {t.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="px-3 py-1.5 border border-[#17A2B8] hover:bg-[#17A2B8] text-[#17A2B8] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="px-3 py-1.5 border border-[#DC3545] hover:bg-[#DC3545] text-[#DC3545] hover:text-white font-accent text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs uppercase tracking-widest font-accent">
                        Belum ada data trainer terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Entry Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 relative rounded shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            <h3 className="font-heading text-xl text-slate-800 mb-6 uppercase tracking-wider border-b border-slate-100 pb-3">
              {editingID ? 'Edit Data Trainer' : 'Registrasi Trainer Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#DC3545] rounded transition-all font-body"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#DC3545] rounded transition-all font-body"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#DC3545] rounded transition-all font-body"
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#DC3545] rounded transition-all font-body"
                  placeholder="trainer@prabugym.com"
                />
              </div>

              {editingID && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#DC3545] border-slate-200 bg-slate-50 rounded focus:ring-[#DC3545]/30 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer">
                    Status Aktif
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 text-xs font-accent font-bold uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 rounded transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-accent font-bold uppercase tracking-widest bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm transition-all cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
