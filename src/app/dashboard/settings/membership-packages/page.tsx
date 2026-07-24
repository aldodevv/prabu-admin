'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { packagesApi } from '@/core/api';
import { MembershipPackage } from '@/core/types';
import { formatIDR } from '@/core/constants';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { List, Plus, Edit, Trash2, Save, ArrowLeft, Search, RotateCcw } from 'lucide-react';

export default function MembershipPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search state
  const [search, setSearch] = useState('');

  // Form modal/step state: 'list' | 'create' | 'edit'
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await packagesApi.listMembershipPackages();
      setPackages(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data Paket Anggota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDurationDays(30);
    setPrice(0);
    setDescription('');
    setError(null);
    setSuccess(null);
    setStep('create');
  };

  const handleOpenEdit = (pkg: MembershipPackage) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setDurationDays(pkg.duration_days);
    setPrice(pkg.price);
    setDescription(pkg.description || '');
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
        duration_days: Number(durationDays),
        package_type: 'Reguler',
        price: Number(price),
        description,
        created_by_name: user?.full_name || 'Prabu GYM Admin'
      };

      if (step === 'create') {
        await packagesApi.createMembershipPackage(payload);
        setSuccess('Paket Anggota berhasil dibuat!');
      } else if (step === 'edit' && editingId) {
        await packagesApi.updateMembershipPackage(editingId, payload);
        setSuccess('Paket Anggota berhasil diperbarui!');
      }
      fetchPackages();
      setTimeout(() => setStep('list'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan Paket Anggota');
    }
  };

  const handleDelete = async (id: string, pkgName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus paket "${pkgName}"?`)) return;
    try {
      await packagesApi.deleteMembershipPackage(id);
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus paket anggota');
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    return pkg.name.toLowerCase().includes(search.toLowerCase()) || 
      (pkg.description || '').toLowerCase().includes(search.toLowerCase());
  });

  const columns: Column<MembershipPackage>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1, className: 'w-12 text-center' },
    { key: 'name', header: 'Nama Paket', render: (row) => <span className="font-bold text-slate-800">{row.name}</span> },
    { key: 'duration_days', header: 'Jumlah Hari', render: (row) => <span className="font-mono">{row.duration_days} hari</span>, className: 'text-center' },
    { key: 'price', header: 'Harga Paket', render: (row) => <span className="font-bold text-slate-800">{formatIDR(row.price)}</span> },
    { key: 'description', header: 'Keterangan Paket', render: (row) => row.description || '-', className: 'text-slate-600' },
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
      <PageHeader title="Paket Anggota" description="Pengaturan" />

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
        <div className="space-y-6">
          {/* Top Search Filter Box matching Screenshot UI */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="bg-[#17A2B8] px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Pencarian</span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="-Ketik Pencarian-"
                className="bg-slate-50 border border-slate-300 px-3 py-2 text-xs rounded w-full sm:w-64 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {}}
                className="px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Pencarian</span>
              </button>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan Semua</span>
              </button>
            </div>
          </div>

          {/* Main Table Box */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="bg-[#17A2B8] px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                <span>Paket Anggota</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <button
                onClick={handleOpenCreate}
                className="px-3.5 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Paket Anggota</span>
              </button>

              <DataTable
                data={filteredPackages}
                columns={columns}
                loading={loading}
                emptyMessage="Belum ada data Paket Anggota."
              />
            </div>
          </div>
        </div>
      )}

      {(step === 'create' || step === 'edit') && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">
              {step === 'create' ? 'Tambah Paket Anggota Baru' : 'Ubah Paket Anggota'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Nama Paket *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800"
                placeholder="Contoh: 1 bulan (Daftar)"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Jumlah Hari *</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Harga Paket (Rp) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Keterangan Paket</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded"
                placeholder="Contoh: Pendaftaran member Prabu GYM 1 bulan (30 hari)"
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Paket</span>
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
