'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { distributorsApi } from '@/core/api';
import { Distributor } from '@/core/types';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';

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
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDistributors();
  }, []);

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

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredDistributors(distributors);
      return;
    }
    const filtered = distributors.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDistributors(filtered);
  };

  const handleShowAll = () => {
    setSearchQuery('');
    setFilteredDistributors(distributors);
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
          name,
          phone_hp: phoneHP,
          phone_telp: phoneTelp,
          address
        });
        if (res.success) {
          setSuccessMsg('Distributor berhasil ditambahkan!');
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
          address
        });
        if (res.success) {
          setSuccessMsg('Distributor berhasil diperbarui!');
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

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb / Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span>Data Distributor</span>
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
          {/* Card Pencarian */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
              <Search className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Pencarian</span>
            </div>
            <div className="p-5 flex flex-wrap items-center gap-3">
              <select
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-350 text-slate-700 text-xs px-3 py-2.5 rounded focus:outline-none min-w-[200px]"
              >
                <option value="">-Pilih-</option>
                {distributors.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Pencarian
              </button>
              <button
                onClick={handleShowAll}
                className="px-4 py-2.5 bg-[#E0A800] hover:bg-[#c69500] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
              >
                Tampilkan Semua
              </button>
            </div>
          </div>

          {/* Card Tabel Data */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex justify-between items-center select-none">
              <span className="text-sm uppercase tracking-wider">Data Distributor</span>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#007BFF] hover:bg-[#0069D9] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
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
                        <th className="py-3 px-4 border-r border-slate-300">Nomor Telpon</th>
                        <th className="py-3 px-4 border-r border-slate-300">Alamat</th>
                        <th className="py-3 px-4 text-center w-36">Aksi</th>
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
                              <button
                                onClick={() => handleOpenEdit(d)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white text-[11px] font-semibold rounded shadow-sm cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Ubah
                              </button>
                              <button
                                onClick={() => handleDelete(d.id, d.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-[11px] font-semibold rounded shadow-sm cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Hapus
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
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">
              {view === 'add' ? 'Tambah Distributor' : 'Ubah Distributor'}
            </span>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
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

              <div className="space-y-4">
                {/* Nama Distributor */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">
                    Nama Distributor
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan Nama Distributor"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                    required
                  />
                </div>

                {/* Nomor HP */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={phoneHP}
                    onChange={(e) => setPhoneHP(e.target.value)}
                    placeholder="Masukkan Nomor HP"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                  />
                </div>

                {/* Nomor Telepon */}
                <div className="flex items-center">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={phoneTelp}
                    onChange={(e) => setPhoneTelp(e.target.value)}
                    placeholder="Masukkan Nomor Telepon"
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-mono"
                  />
                </div>

                {/* Alamat */}
                <div className="flex items-start">
                  <label className="w-1/3 text-slate-600 text-sm font-semibold mt-1.5">
                    Alamat
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masukkan Alamat"
                    rows={4}
                    className="w-2/3 bg-white border border-slate-300 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
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
