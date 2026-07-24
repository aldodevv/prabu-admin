'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { packagesApi } from '@/core/api';
import { GymClass } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { List, Plus, Edit, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function GymClassesPage() {
  const { user } = useAuth();
  const [classList, setClassList] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form modal/step state: 'list' | 'create' | 'edit'
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form field
  const [name, setName] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await packagesApi.listGymClasses();
      setClassList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil Daftar Nama Kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setError(null);
    setSuccess(null);
    setStep('create');
  };

  const handleOpenEdit = (c: GymClass) => {
    setEditingId(c.id);
    setName(c.name);
    setError(null);
    setSuccess(null);
    setStep('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        created_by_name: user?.full_name || 'Prabu GYM Admin'
      };

      if (step === 'create') {
        await packagesApi.createGymClass(payload);
        setSuccess('Nama Kelas berhasil ditambahkan!');
      } else if (step === 'edit' && editingId) {
        await packagesApi.updateGymClass(editingId, payload);
        setSuccess('Nama Kelas berhasil diperbarui!');
      }
      fetchClasses();
      setTimeout(() => setStep('list'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan Nama Kelas');
    }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${className}"?`)) return;
    try {
      await packagesApi.deleteGymClass(id);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kelas');
    }
  };

  const columns: Column<GymClass>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1, className: 'w-12 text-center' },
    { key: 'name', header: 'Nama Kelas', render: (row) => <span className="font-bold text-slate-800">{row.name}</span> },
    { key: 'created_by_name', header: 'Nama Petugas', render: (row) => row.created_by_name || 'Prabu GYM Admin', className: 'text-slate-700' },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2 py-0.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
          >
            ✏ Ubah
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="px-2 py-0.5 border border-red-500 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
          >
            🗑 Hapus
          </button>
        </div>
      ),
      className: 'text-center'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Daftar Nama Kelas" description="Pengaturan" />

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
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
          <div className="bg-[#17A2B8] px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Daftar Nama Kelas</span>
          </div>

          <div className="p-4 space-y-4">
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Nama Kelas</span>
            </button>

            <DataTable
              data={classList}
              columns={columns}
              loading={loading}
              emptyMessage="Belum ada data Nama Kelas."
            />
          </div>
        </div>
      )}

      {(step === 'create' || step === 'edit') && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">
              {step === 'create' ? 'Tambah Nama Kelas Baru' : 'Ubah Nama Kelas'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Nama Kelas *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800"
                placeholder="Contoh: Body Combat / Yoga / Aerobik"
                required
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kelas</span>
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
