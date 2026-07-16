'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { membersApi, transactionsApi } from '@/core/api';
import { formatDateLabel, formatIDR, getMembershipTypeFromNotes, getPaymentMethodFromNotes } from '@/core/constants';
import { Member, Transaction } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { OfficialReceiptTemplate } from '@/components/core/PrintTemplates';
import { Search, Eye, Edit, ArrowLeft, Save, Printer, FileText } from 'lucide-react';

export default function AllClubMembersPanel() {
  const { user } = useAuth();
  
  // Navigation states: 'list' | 'detail' | 'edit'
  const [step, setStep] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Members List states
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filters matching Search Box
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Edit states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Details Sub-tabs: 'anggota' | 'latihan'
  const [detailTab, setDetailTab] = useState<'anggota' | 'latihan'>('anggota');
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const fetchMembers = async (forceSearch = '') => {
    setLoading(true);
    try {
      const qSearch = forceSearch !== undefined ? forceSearch : search;
      // Omit branch_id parameter to load across all branches
      const res = await membersApi.list({
        page,
        search: qSearch,
        per_page: 20
      });
      if (res.success && res.data) {
        let list = res.data;
        // Filter status client-side if statusFilter is not 'Semua'
        if (statusFilter === 'Aktif') {
          list = list.filter((m: Member) => m.is_active && new Date(m.membership_end) >= new Date());
        } else if (statusFilter === 'Expired') {
          list = list.filter((m: Member) => m.is_active && new Date(m.membership_end) < new Date());
        } else if (statusFilter === 'Nonaktif') {
          list = list.filter((m: Member) => !m.is_active);
        }
        setMembers(list);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleResetSearch = () => {
    setSearch('');
    setStatusFilter('Semua');
    setPage(1);
    fetchMembers('');
  };

  const handleOpenDetail = async (m: Member) => {
    setSelectedMember(m);
    setDetailTab('anggota');
    setStep('detail');
    setLoadingTransactions(true);
    try {
      // Query member's specific branch transactions
      const res = await transactionsApi.list({
        branch_id: m.branch_id || undefined,
        per_page: 100
      });
      if (res.success && res.data) {
        const filtered = res.data.filter(
          (tx: Transaction) =>
            tx.member_id === m.id ||
            (tx.notes && tx.notes.toLowerCase().includes(m.full_name.toLowerCase()))
        );
        setMemberTransactions(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleOpenEdit = (m: Member) => {
    setSelectedMember(m);
    setFullName(m.full_name);
    setGender(m.gender || 'Laki-laki');
    setDob(m.date_of_birth || '');
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setAddress(m.address || '');
    setPhotoBase64(m.photo_url || '');
    setEditError('');
    setEditSuccess('');
    setStep('edit');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoading(true);
    setEditError('');
    setEditSuccess('');

    const body = {
      full_name: fullName,
      email,
      phone,
      address,
      date_of_birth: dob,
      gender,
      membership_type: selectedMember.membership_type,
      membership_start: selectedMember.membership_start,
      membership_end: selectedMember.membership_end,
      is_active: selectedMember.is_active,
      photo_url: photoBase64,
    };

    try {
      const res = await membersApi.update(selectedMember.id, body);
      if (res.success) {
        setEditSuccess('Data anggota berhasil disimpan.');
        // Refresh the member data list
        fetchMembers();
        setTimeout(() => {
          setStep('list');
        }, 1200);
      } else {
        setEditError(res.error || 'Gagal mengubah data anggota.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  // Columns definition for DataTable
  const columns: Column<Member>[] = [
    {
      key: 'no',
      header: 'No',
      align: 'center',
      className: 'w-12',
      render: (_, idx) => idx + 1
    },
    {
      key: 'photo',
      header: 'Foto',
      align: 'center',
      className: 'w-28',
      render: (m) => (
        <div className="w-20 h-20 mx-auto bg-slate-50 border border-slate-200 rounded overflow-hidden flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold select-none">
          {m.photo_url ? (
            <img src={m.photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            'No Photo'
          )}
        </div>
      )
    },
    {
      key: 'username',
      header: 'Nomor Anggota',
      className: 'font-mono text-slate-800',
      render: (m) => `@${m.username}`
    },
    {
      key: 'full_name',
      header: 'Nama Anggota',
      className: 'text-slate-800 font-bold'
    },
    {
      key: 'membership_type',
      header: 'Paket Anggota',
      className: 'text-slate-700 uppercase text-xs'
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      className: 'w-36',
      render: (m) => (
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => handleOpenDetail(m)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
          >
            <Eye className="w-3 h-3" />
            View Detail
          </button>
          <button
            onClick={() => handleOpenEdit(m)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#007BFF] hover:bg-[#0069d9] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="no-print space-y-6">
        
        {/* Main List Step */}
        {step === 'list' && (
          <div className="space-y-6">
            <PageHeader 
              title="Data Anggota" 
              description="Seluruh Cabang — Daftar Anggota & Riwayat Keuangan Aktif" 
            />

            {/* Search Box */}
            <SearchFilterBar
              searchQuery={search}
              onSearchChange={setSearch}
              onSearchSubmit={handleSearchSubmit}
              searchPlaceholder="Cari nama, nomor HP, email..."
              onReset={handleResetSearch}
            >
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded"
              >
                <option value="Semua">-Pilih-</option>
                <option value="Aktif">Status: ...Aktif</option>
                <option value="Expired">Status: Expired</option>
                <option value="Nonaktif">Status: Nonaktif</option>
              </select>
            </SearchFilterBar>

            {/* Members Table */}
            <DataTable
              title="Daftar Anggota All Club"
              columns={columns}
              data={members}
              loading={loading}
              loadingMessage="Loading data anggota..."
              emptyMessage="Tidak ada data anggota ditemukan."
              currentPage={page}
              totalItems={total}
              itemsPerPage={20}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Member Details Step */}
        {step === 'detail' && selectedMember && (
          <div className="space-y-6 animate-fadeIn">
            <PageHeader 
              title="Daftar Anggota" 
              action={
                <button
                  onClick={() => setStep('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              }
            />

            {/* Data Personal Table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">Data Personal</h3>
              <div className="border border-slate-200 overflow-hidden rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nomor Anggota</td>
                      <td className="py-2.5 px-4 font-mono text-slate-800">@{selectedMember.username}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Nama Anggota</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{selectedMember.full_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Jenis Kelamin</td>
                      <td className="py-2.5 px-4 text-slate-800">{selectedMember.gender || 'Laki-Laki'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Tanggal Lahir</td>
                      <td className="py-2.5 px-4 text-slate-700">{selectedMember.date_of_birth || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Nomor HP</td>
                      <td className="py-2.5 px-4 font-mono text-slate-800">{selectedMember.phone || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Email</td>
                      <td className="py-2.5 px-4 text-slate-800">{selectedMember.email || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Alamat</td>
                      <td className="py-2.5 px-4 text-slate-700 font-body">{selectedMember.address || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Tanggal Bergabung</td>
                      <td className="py-2.5 px-4 text-slate-600">{new Date(selectedMember.created_at || '').toLocaleDateString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaksi Pembayaran Section */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">Transaksi Pembayaran</h3>
              
              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 text-xs no-print select-none">
                <button
                  onClick={() => setDetailTab('anggota')}
                  className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                    detailTab === 'anggota'
                      ? 'border-[#007BFF] text-[#007BFF]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Transaksi Pembayaran Anggota
                </button>
                <button
                  onClick={() => setDetailTab('latihan')}
                  className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                    detailTab === 'latihan'
                      ? 'border-[#007BFF] text-[#007BFF]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Transaksi Pembayaran Latihan
                </button>
              </div>

              {loadingTransactions ? (
                <div className="text-center py-8 text-slate-500 font-semibold text-xs">
                  Loading history transaksi...
                </div>
              ) : detailTab === 'anggota' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                    <thead className="bg-[#6C7A89] text-white text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tanggal Pembayaran</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nomor Transaksi</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Paket Anggota</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Masa Aktif</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-right">Total Pembayaran</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Keterangan</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama CS</th>
                        <th className="py-2.5 px-3 text-center no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                      {memberTransactions.length > 0 ? (
                        memberTransactions.map((tx, idx) => {
                          const pkg = getMembershipTypeFromNotes(tx.notes || '');
                          return (
                            <tr key={tx.id}>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center">{idx + 1}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(tx.transaction_date)}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">{tx.transaction_number}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 uppercase text-[10px]">{pkg}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[10px]">
                                {formatDateLabel(selectedMember.membership_start)} s/d {formatDateLabel(selectedMember.membership_end)}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-right text-slate-800 font-black">{formatIDR(tx.total_amount)}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 font-normal leading-relaxed">{tx.notes || '-'}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{tx.admin_name}</td>
                              <td className="py-2.5 px-3 text-center select-none no-print">
                                <div className="flex gap-1.5 justify-center">
                                  <button
                                    onClick={() => {
                                      setReceiptTx(tx);
                                      setTimeout(() => {
                                        window.print();
                                      }, 100);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#17A2B8] hover:bg-[#138496] border border-[#17A2B8] text-white text-[9px] font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Cetak
                                  </button>
                                  <button
                                    onClick={() => setReceiptTx(tx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[9px] font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Document
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wider">
                            Belum ada transaksi pembayaran untuk anggota ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-bold select-none text-xs uppercase tracking-wider">
                  Belum ada transaksi pembayaran latihan harian untuk anggota ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ubah Data Anggota Step */}
        {step === 'edit' && selectedMember && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <PageHeader 
              title="Ubah Data Anggota" 
              action={
                <button
                  onClick={() => setStep('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Batal</span>
                </button>
              }
            />

            {editError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                ⚠️ {editError}
              </div>
            )}

            {editSuccess && (
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                ✓ {editSuccess}
              </div>
            )}

            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
              <form onSubmit={handleUpdateMember} className="space-y-6 text-sm text-slate-700">
                {/* Form fields */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor Anggota</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`@${selectedMember.username}`}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent mt-2">Alamat</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-body resize-none"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Foto Profil</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                    />
                    {photoBase64 && (
                      <div className="w-24 h-24 border border-slate-200 rounded overflow-hidden">
                        <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-150 pt-6">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-all shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Print Official Receipt Overlay */}
      {receiptTx && selectedMember && (
        <OfficialReceiptTemplate
          onClose={() => setReceiptTx(null)}
          data={{
            transactionNumber: receiptTx.transaction_number,
            transactionDate: receiptTx.transaction_date,
            memberUsername: selectedMember.username,
            memberName: selectedMember.full_name,
            packageName: getMembershipTypeFromNotes(receiptTx.notes || ''),
            membershipStart: selectedMember.membership_start,
            membershipEnd: selectedMember.membership_end,
            paymentMethod: getPaymentMethodFromNotes(receiptTx.notes || ''),
            price: receiptTx.total_amount,
            cashierName: user?.full_name || 'Kasir Prabu GYM'
          }}
        />
      )}
    </div>
  );
}
