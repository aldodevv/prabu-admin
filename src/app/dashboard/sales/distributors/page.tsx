'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { distributorsApi } from '@/core/api';
import { Distributor } from '@/core/types';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/lib/excelExport';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';

export default function DistributorsPage() {
  const { activeBranchID } = useAuth();
  
  // view: 'list' | 'add' | 'edit'
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phoneHP, setPhoneHP] = useState('');
  const [phoneTelp, setPhoneTelp] = useState('');
  const [address, setAddress] = useState('');
  
  // Search, Debounce & Column Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [isTyping, setIsTyping] = useState(false);
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDistributors();
  }, []);

  // Handle typing state
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchQuery, debouncedSearch]);

  // Execute filtering when debounced search query or column filter changes
  useEffect(() => {
    applyFilter();
  }, [debouncedSearch, filterColumn, distributors]);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const res = await distributorsApi.list();
      if (res.success && res.data) {
        setDistributors(res.data);
        setFilteredDistributors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (!debouncedSearch.trim() && !filterColumn) {
      setFilteredDistributors(distributors);
      return;
    }

    const query = debouncedSearch.toLowerCase().trim();
    const filtered = distributors.filter((d) => {
      if (filterColumn === 'name') {
        return d.name.toLowerCase().includes(query);
      }
      if (filterColumn === 'phone_hp') {
        return (d.phone_hp || '').toLowerCase().includes(query);
      }
      if (filterColumn === 'phone_telp') {
        return (d.phone_telp || '').toLowerCase().includes(query);
      }
      if (filterColumn === 'address') {
        return (d.address || '').toLowerCase().includes(query);
      }

      // Default: match all columns
      return (
        d.name.toLowerCase().includes(query) ||
        (d.phone_hp || '').toLowerCase().includes(query) ||
        (d.phone_telp || '').toLowerCase().includes(query) ||
        (d.address || '').toLowerCase().includes(query)
      );
    });

    setFilteredDistributors(filtered);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterColumn('');
    setFilteredDistributors(distributors);
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nama Distributor', 'Nomor HP', 'Nomor Telepon', 'Alamat'];
    const data = filteredDistributors.map((d, index) => [
      index + 1,
      d.name,
      d.phone_hp || '-',
      d.phone_telp || '-',
      d.address || '-',
    ]);

    exportToExcel({
      filename: `Data_Distributor_Prabu_Gym_${new Date().toISOString().split('T')[0]}`,
      title: 'DATA DISTRIBUTOR - PRABU GYM',
      headers,
      data,
    });
  };

  const handleOpenAdd = () => {
    setName('');
    setPhoneHP('');
    setPhoneTelp('');
    setAddress('');
    setErrorMsg('');
    setSuccessMsg('');
    setView('add');
  };

  const handleOpenEdit = (dist: Distributor) => {
    setSelectedDistributor(dist);
    setName(dist.name);
    setPhoneHP(dist.phone_hp || '');
    setPhoneTelp(dist.phone_telp || '');
    setAddress(dist.address || '');
    setErrorMsg('');
    setSuccessMsg('');
    setView('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama distributor tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (view === 'add') {
        const res = await distributorsApi.create({
          branch_id: activeBranchID || undefined,
          name,
          phone_hp: phoneHP,
          phone_telp: phoneTelp,
          address,
        });
        if (res.success) {
          setSuccessMsg('Distributor berhasil ditambahkan');
          fetchDistributors();
          setTimeout(() => setView('list'), 1000);
        } else {
          setErrorMsg(res.error || 'Gagal menambahkan distributor');
        }
      } else if (view === 'edit' && selectedDistributor) {
        const res = await distributorsApi.update(selectedDistributor.id, {
          name,
          phone_hp: phoneHP,
          phone_telp: phoneTelp,
          address,
        });
        if (res.success) {
          setSuccessMsg('Distributor berhasil diperbarui');
          fetchDistributors();
          setTimeout(() => setView('list'), 1000);
        } else {
          setErrorMsg(res.error || 'Gagal memperbarui distributor');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, distName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus distributor "${distName}"?`)) {
      return;
    }

    try {
      const res = await distributorsApi.delete(id);
      if (res.success) {
        alert('Distributor berhasil dihapus');
        fetchDistributors();
      } else {
        alert(res.error || 'Gagal menghapus distributor');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus distributor');
    }
  };

  const columnOptions = [
    { label: 'Nama Distributor', value: 'name' },
    { label: 'Nomor HP', value: 'phone_hp' },
    { label: 'Nomor Telepon', value: 'phone_telp' },
    { label: 'Alamat', value: 'address' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Breadcrumb */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Master Data</span>
          <span>&gt;</span>
          <span className="text-[#DC3545]">Distributor</span>
          {view === 'add' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Tambah Distributor</span>
            </>
          )}
          {view === 'edit' && (
            <>
              <span>&gt;</span>
              <span className="text-[#DC3545]">Ubah Distributor</span>
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-1 uppercase tracking-tight select-none">
          {view === 'list' ? 'Data Distributor' : view === 'add' ? 'Tambah Distributor' : 'Ubah Distributor'}
        </h2>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          {/* Reusable Search & Filter Bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Ketik pencarian distributor..."
            columnOptions={columnOptions}
            selectedColumn={filterColumn}
            onColumnChange={setFilterColumn}
            isTyping={isTyping}
            onReset={handleReset}
          />

          {/* Card Tabel Data */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
              <span className="text-sm uppercase tracking-wider">Data Distributor</span>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Distributor
              </button>

              {loading ? (
                <div className="text-center py-10 text-slate-500 font-accent uppercase tracking-widest text-xs">
                  Loading data distributor...
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-sm text-slate-650 border-collapse">
                    <thead className="bg-[#6C7A89] text-white text-[11px] uppercase tracking-wider font-bold select-none border-b border-slate-350">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-300 w-12 text-center">No</th>
                        <th className="py-3 px-4 border-r border-slate-300">Distributor</th>
                        <th className="py-3 px-4 border-r border-slate-300">Nomor HP</th>
                        <th className="py-3 px-4 border-r border-slate-300">Nomor Telepon</th>
                        <th className="py-3 px-4 border-r border-slate-300">Alamat</th>
                        <th className="py-3 px-4 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                      {filteredDistributors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-accent uppercase tracking-wider text-xs">
                            Tidak ada data distributor
                          </td>
                        </tr>
                      ) : (
                        filteredDistributors.map((d, index) => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 border-r border-slate-100 text-center font-semibold text-slate-500">{index + 1}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800">{d.name}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-600">{d.phone_hp || '-'}</td>
                            <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-600">{d.phone_telp || '-'}</td>
                            <td className="py-3 px-4 border-r border-slate-100 text-xs text-slate-600">{d.address || '-'}</td>
                            <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                              {/* Icon-Only Action Buttons with Hover Tooltip */}
                              <button
                                onClick={() => handleOpenEdit(d)}
                                title="Ubah Data Distributor"
                                className="p-2 bg-[#17A2B8] hover:bg-[#138496] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(d.id, d.name)}
                                title="Hapus Data Distributor"
                                className="p-2 bg-[#DC3545] hover:bg-[#C82333] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Form Tambah / Edit */
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden w-full">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">
              {view === 'add' ? 'Tambah Distributor' : 'Ubah Distributor'}
            </span>
          </div>
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold px-4 py-3 border border-red-200 rounded">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-3 border border-emerald-200 rounded">
                  ✓ {successMsg}
                </div>
              )}

              <div className="space-y-5">
                {/* Nama Distributor */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Nama Distributor
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan Nama Distributor"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded"
                    required
                  />
                </div>

                {/* Nomor HP */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    value={phoneHP}
                    onChange={(e) => setPhoneHP(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan Nomor HP"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded font-mono"
                  />
                </div>

                {/* Nomor Telepon */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={phoneTelp}
                    onChange={(e) => setPhoneTelp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan Nomor Telepon"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded font-mono"
                  />
                </div>

                {/* Alamat */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left mt-2">
                    Alamat
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masukkan Alamat"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#17A2B8] focus:outline-none text-slate-800 px-3.5 py-2.5 text-xs transition-all rounded resize-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
