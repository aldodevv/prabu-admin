'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { employeesApi, branchesApi } from '@/core/api';
import { Branch } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { ShieldCheck, UserPlus, Edit, Trash2, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { FetchErrorAlert } from '@/components/core/FetchErrorAlert';

export default function AdminStaffManagementPage() {
  const { user } = useAuth();
  const [adminList, setAdminList] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form step: 'list' | 'create' | 'edit'
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [branchID, setBranchID] = useState('');
  const [role, setRole] = useState<'developer' | 'owner' | 'admin' | 'cs'>('cs');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchAdminList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeesApi.list({ page, per_page: perPage });
      const staff = res.data || [];
      setAdminList(staff);
      setTotal(res.meta?.total || staff.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data Staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await branchesApi.list();
      setBranches(res.data || []);
      if (res.data && res.data.length > 0) {
        setBranchID(res.data[0].id);
      }
    } catch (err) {
      console.error('Gagal mengambil cabang:', err);
    }
  };

  useEffect(() => {
    fetchAdminList();
    fetchBranches();
  }, [page, perPage]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('owner');
    setShowFormPassword(false);
    if (branches.length > 0) setBranchID(branches[0].id);
    setError(null);
    setSuccess(null);
    setStep('create');
  };

  const handleOpenEdit = (adm: any) => {
    setEditingId(adm.id);
    setUsername(adm.username || '');
    setFullName(adm.full_name || '');
    setEmail(adm.email || '');
    setPhone(adm.phone || '');
    setPassword(adm.password || '');
    setRole(adm.role || 'cs');
    setShowFormPassword(false);
    setBranchID(adm.branch_id || (branches[0]?.id || ''));
    setError(null);
    setSuccess(null);
    setStep('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (step === 'create') {
        await employeesApi.create({
          branch_id: branchID,
          username: username.trim() || undefined,
          full_name: fullName,
          email,
          phone,
          password: password || undefined,
          role: role,
          work_start_time: '08:00:00'
        });
        setSuccess('Akun Staff berhasil dibuat!');
      } else if (step === 'edit' && editingId) {
        await employeesApi.update(editingId, {
          username: username.trim() || undefined,
          full_name: fullName,
          email,
          phone,
          password: password || undefined,
          role: role
        });
        setSuccess('Data Staff berhasil diperbarui!');
      }
      fetchAdminList();
      setTimeout(() => setStep('list'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data Staff');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan Staff ${name}?`)) return;
    try {
      await employeesApi.delete(id);
      fetchAdminList();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus Staff');
    }
  };

  // State to track password visibility per Admin ID
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: Column<any>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1, className: 'w-12 text-center' },
    { key: 'username', header: 'Username', render: (row) => <span className="font-mono font-bold text-slate-800">{row.username}</span> },
    {
      key: 'password',
      header: 'Password',
      render: (row) => {
        // 1. Akun developer selalu diproteksi (tidak bisa dilihat siapapun)
        if (row.role === 'developer') {
          return <span className="text-slate-400 font-bold font-mono text-xs select-none">••••••••</span>;
        }

        // 2. Developer & Owner dapat melihat password semua akun (kecuali developer)
        // 3. Role Admin HANYA bisa melihat password CS / Kasir di cabangnya sendiri
        const isCsRole = row.role === 'cs' || row.role === 'karyawan';
        const isSameBranch =
          Boolean((row.branch_id && user?.branch_id && row.branch_id === user?.branch_id) ||
          (row.branch_name && user?.branch_name && row.branch_name.toLowerCase() === user?.branch_name.toLowerCase()));

        const canView =
          user?.role === 'developer' ? true :
          user?.role === 'owner' ? true :
          user?.role === 'admin' ? (isCsRole && isSameBranch) :
          false;

        if (!canView || !row.password) {
          return <span className="text-slate-400 font-bold font-mono text-xs select-none">••••••••</span>;
        }

        const isVisible = !!showPasswordMap[row.id];
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs select-none">
            <span className={`font-bold ${isVisible ? 'text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-slate-400'}`}>
              {isVisible ? row.password : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => togglePassword(row.id)}
              className="p-1 text-slate-400 hover:text-[#DC3545] transition-colors cursor-pointer"
              title={isVisible ? 'Sembunyikan Password' : 'Lihat Password'}
            >
              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      }
    },
    { key: 'full_name', header: 'Nama Lengkap', render: (row) => <span className="font-bold text-slate-800">{row.full_name}</span> },
    { key: 'branch_name', header: 'Cabang Tugas', render: (row) => <span className="uppercase text-[10px] font-bold text-[#DC3545]">{row.branch_name}</span> },
    { key: 'phone', header: 'Nomor HP', render: (row) => <span className="font-mono text-slate-700">{row.phone || '-'}</span> },
    { key: 'email', header: 'Email', render: (row) => <span className="text-slate-600">{row.email || '-'}</span> },
    {
      key: 'role',
      header: 'Role / Hak Akses',
      render: (row) => {
        if (row.role === 'developer') return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">Developer</span>;
        if (row.role === 'owner') return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">Owner</span>;
        if (row.role === 'admin') return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">Admin (Read-Only)</span>;
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">CS / Kasir</span>;
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => {
        if (user?.role !== 'developer' && row.role === 'developer') {
          return <span className="text-[10px] text-slate-400 font-semibold italic">Protected</span>;
        }
        return (
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => handleOpenEdit(row)}
              className="px-2.5 py-1 bg-brand-cyan hover:bg-[#138496] text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              Ubah
            </button>

            <button
              onClick={() => handleDelete(row.id, row.full_name)}
              className="px-2.5 py-1 bg-[#DC3545] hover:bg-[#c82333] text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Hapus
            </button>
          </div>
        );
      },
      className: 'text-center'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Staff System"
        description="Manajemen Akun Admin, Owner, & CS Seluruh Cabang"
        action={
          step === 'list' ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Staff</span>
            </button>
          ) : (
            <button
              onClick={() => setStep('list')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          )
        }
      />

      <FetchErrorAlert error={error} featureName="Data Staff" onRetry={fetchAdminList} />

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          ✓ {success}
        </div>
      )}

      {step === 'list' && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-[#DC3545]" />
            <h3 className="font-heading text-base font-bold text-slate-800 uppercase tracking-wider">
              Daftar Seluruh Akun Staff &amp; CS System
            </h3>
          </div>

          <DataTable
            data={adminList}
            columns={columns}
            loading={loading}
            currentPage={page}
            totalItems={total}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={(val) => {
              setPerPage(val);
              setPage(1);
            }}
            emptyMessage="Belum ada data Staff."
          />
        </div>
      )}

      {(step === 'create' || step === 'edit') && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="bg-[#DC3545] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">
              {step === 'create' ? 'Tambah Staff Baru' : 'Ubah Data Staff'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Role / Hak Akses *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold text-slate-800"
                required
              >
                {user?.role === 'developer' && <option value="developer">Developer (Akses Penuh + Kelola Cabang)</option>}
                <option value="owner">Owner (Full Features)</option>
                <option value="admin">Admin (Read-Only Semua Cabang)</option>
                <option value="cs">CS / Kasir Cabang</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Cabang Tugas *</label>
              <select
                value={branchID}
                onChange={(e) => setBranchID(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800"
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Username Akses Login Admin</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#DC3545]"
                placeholder={step === 'create' ? 'Otomatis dibuat jika dikosongkan (contoh: admin1234)' : 'Username Admin'}
              />
              <span className="text-[10px] text-slate-400 block">
                Digunakan Admin untuk login. Dikosongkan saat pembuatan = dibuat otomatis oleh sistem.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Nama Lengkap Admin *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800"
                placeholder="Contoh: Admin Prabu System"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Password Akses Login Admin {step === 'create' ? '*' : ''}</label>
              <div className="relative flex items-center">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 pr-10 rounded font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#DC3545]"
                  placeholder="Masukkan Password Admin (Contoh: admin123456)"
                  required={step === 'create'}
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 text-slate-400 hover:text-[#DC3545] p-1 cursor-pointer"
                  title={showFormPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {step === 'create' ? 'Password ini digunakan Admin untuk login ke sistem' : 'Ubah password jika ingin memperbarui, atau biarkan jika tidak berubah'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded"
                placeholder="admin@prabugym.id"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-mono"
                placeholder="08123456789"
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setStep('list')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
