'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { trainersApi, branchesApi } from '@/core/api';
import { Trainer, Branch } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { UserCheck, UserPlus, Edit, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function TrainerStaffManagementPage() {
  const { user } = useAuth();
  const [trainerList, setTrainerList] = useState<Trainer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form step: 'list' | 'create' | 'edit'
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [branchID, setBranchID] = useState('');

  const fetchTrainerList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trainersApi.list();
      setTrainerList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil Data Pelatih');
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
    fetchTrainerList();
    fetchBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setGender('Laki-laki');
    if (branches.length > 0) setBranchID(branches[0].id);
    setError(null);
    setSuccess(null);
    setStep('create');
  };

  const handleOpenEdit = (trainer: Trainer) => {
    setEditingId(trainer.id);
    setFullName(trainer.full_name || '');
    setEmail(trainer.email || '');
    setPhone(trainer.phone || '');
    setGender(trainer.gender || 'Laki-laki');
    setBranchID(trainer.branch_id || (branches[0]?.id || ''));
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
        await trainersApi.create({
          branch_id: branchID,
          full_name: fullName,
          email,
          phone,
          gender
        });
        setSuccess('Pelatih baru berhasil ditambahkan!');
      } else if (step === 'edit' && editingId) {
        await trainersApi.update(editingId, {
          branch_id: branchID,
          full_name: fullName,
          email,
          phone,
          gender
        });
        setSuccess('Data Pelatih berhasil diperbarui!');
      }
      fetchTrainerList();
      setTimeout(() => setStep('list'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan Data Pelatih');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan Pelatih ${name}?`)) return;
    try {
      await trainersApi.delete(id);
      fetchTrainerList();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus Pelatih');
    }
  };

  const columns: Column<Trainer>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1, className: 'w-12 text-center' },
    { key: 'full_name', header: 'Nama Pelatih', render: (row) => <span className="font-bold text-slate-800">{row.full_name}</span> },
    { key: 'gender', header: 'Jenis Kelamin', render: (row) => row.gender || 'Laki-laki' },
    { key: 'phone', header: 'Nomor HP', render: (row) => <span className="font-mono">{row.phone || '-'}</span> },
    { key: 'email', header: 'Email', render: (row) => row.email || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {row.is_active ? 'Aktif' : 'Non-Aktif'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2.5 py-1 bg-[#17A2B8] hover:bg-[#138496] text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer"
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
      ),
      className: 'text-center'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Pelatih (Trainer)"
        description="Data Staff"
        action={
          step === 'list' ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pelatih</span>
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
            <UserCheck className="w-5 h-5 text-[#17A2B8]" />
            <h3 className="font-heading text-base font-bold text-slate-800 uppercase tracking-wider">
              Daftar Personal Trainer (Pelatih Fitness)
            </h3>
          </div>

          <DataTable
            data={trainerList}
            columns={columns}
            loading={loading}
            emptyMessage="Belum ada data Pelatih/Trainer."
          />
        </div>
      )}

      {(step === 'create' || step === 'edit') && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">
              {step === 'create' ? 'Tambah Pelatih Baru' : 'Ubah Data Pelatih'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Cabang *</label>
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
              <label className="font-bold text-slate-800 block">Nama Lengkap Pelatih *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800"
                placeholder="Contoh: Andrea Tutto"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Email Pelatih</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded"
                placeholder="trainer@prabugym.com"
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
                <span>Simpan Pelatih</span>
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
