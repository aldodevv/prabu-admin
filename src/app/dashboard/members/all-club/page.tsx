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
import { Search, Eye, Edit, ArrowLeft, Save, Printer, FileText, FileSpreadsheet, RotateCcw, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/lib/excelExport';
import { compressImage } from '@/utils/imageCompressor';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { DigitalMemberCard } from '@/components/core/DigitalMemberCard';

export default function AllClubMembersPanel() {
  const { user } = useAuth();
  
  // Navigation states: 'list' | 'detail' | 'edit'
  const [step, setStep] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDigitalCard, setShowDigitalCard] = useState(false);

  // Members List states
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isTyping, setIsTyping] = useState(false);
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
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
    setFilterColumn('');
    setStatusFilter('Semua');
    setPage(1);
    fetchMembers('');
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Cabang', 'Nomor Anggota', 'Nama Anggota', 'Jenis Kelamin', 'Tanggal Lahir', 'Nomor HP', 'Email', 'Paket Anggota', 'Status'];
    const data = members.map((m, index) => [
      index + 1,
      m.branch_name || 'All Club',
      `@${m.username}`,
      m.full_name,
      m.gender || 'Laki-laki',
      m.date_of_birth || '-',
      m.phone || '-',
      m.email || '-',
      m.membership_type || '-',
      m.is_active ? 'Aktif' : 'Tidak Aktif',
    ]);

    exportToExcel({
      filename: `Data_Anggota_All_Club_${new Date().toISOString().split('T')[0]}`,
      title: 'DATA ANGGOTA ALL CLUB - PRABU GYM',
      headers,
      data,
    });
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
    setFullName(m.full_name || '');
    setGender(m.gender || '');
    setDob(m.date_of_birth || '');
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setAddress(m.address || '');
    setPhotoBase64(m.photo_url || '');
    setPhotoUrl(m.photo_url || '');
    setEditError('');
    setEditSuccess('');
    setStep('edit');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPhotoBase64(compressed);
      } catch (err: any) {
        console.error('Gagal mengompres gambar:', err);
      }
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoading(true);
    setEditError('');
    setEditSuccess('');

    let finalPhotoUrl = photoUrl;
    if (photoBase64 && photoBase64.startsWith('data:')) {
      try {
        finalPhotoUrl = await uploadToCloudinary(photoBase64, 'prabugym/members');
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setEditError('Gagal mengunggah foto ke Cloudinary: ' + (err.message || 'Error'));
        setLoading(false);
        return;
      }
    }

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
      photo_url: finalPhotoUrl,
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

  const columnOptions = [
    { label: 'Nomor Anggota', value: 'username' },
    { label: 'Nama Anggota', value: 'full_name' },
    { label: 'Nomor HP', value: 'phone' },
    { label: 'Email', value: 'email' },
    { label: 'Paket Anggota', value: 'membership_type' },
  ];

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
      className: 'w-24',
      render: (m) => (
        <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-200 rounded overflow-hidden flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold select-none">
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
      className: 'w-24',
      render: (m) => (
        <div className="flex gap-1.5 justify-center">
          {/* Icon-Only Buttons with Tooltips */}
          <button
            onClick={() => handleOpenDetail(m)}
            title="Lihat Detail Anggota"
            className="p-2 bg-[#6C7A89] hover:bg-[#5a6673] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(m)}
            title="Ubah Data Anggota"
            className="p-2 bg-[#17A2B8] hover:bg-[#138496] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
          >
            <Edit className="w-3.5 h-3.5" />
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
              searchPlaceholder="Ketik nama, nomor HP, email..."
              columnOptions={columnOptions}
              selectedColumn={filterColumn}
              onColumnChange={setFilterColumn}
              isTyping={isTyping}
              onExportExcel={handleExportExcel}
              onReset={handleResetSearch}
            >
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded font-medium"
              >
                <option value="Semua">Status: Semua</option>
                <option value="Aktif">Status: Aktif</option>
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDigitalCard(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <span>🪪 Kartu Member Digital</span>
                  </button>
                  <button
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>
              }
            />

            {/* Digital Card Modal */}
            {showDigitalCard && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-heading font-bold text-slate-800 text-base">Kartu Anggota Digital</h3>
                    <button
                      onClick={() => setShowDigitalCard(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <DigitalMemberCard
                    member={{
                      username: selectedMember.username,
                      full_name: selectedMember.full_name,
                      email: selectedMember.email,
                      phone: selectedMember.phone,
                      membership_type: selectedMember.membership_type,
                      membership_start: selectedMember.membership_start,
                      membership_end: selectedMember.membership_end,
                    }}
                    branchName={selectedMember.branch_name}
                  />
                </div>
              </div>
            )}

            {/* Data Personal Table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-heading text-lg font-bold text-slate-800">Data Personal</h3>
                <button
                  onClick={() => setShowDigitalCard(true)}
                  className="text-xs font-bold text-[#17A2B8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  🪪 Lihat Kartu Member Digital
                </button>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-6 items-start max-md:grid-cols-1">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 font-bold text-xs shadow-xs">
                    {selectedMember.photo_url ? (
                      <img
                        src={selectedMember.photo_url}
                        alt={selectedMember.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto Anggota</span>
                </div>

                {/* Member Info Table */}
                <div className="border border-slate-200 overflow-hidden rounded-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nomor Anggota</td>
                        <td className="py-2.5 px-4 font-mono text-slate-800">{selectedMember.username}</td>
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
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#007BFF] hover:bg-[#0069D9] text-white text-[9px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Cetak
                                  </button>
                                  <button
                                    onClick={() => setReceiptTx(tx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-[9px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
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

            {/* Re-download Section: Kartu Member Digital & Struk Pembayaran */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#17A2B8]" />
                  <h3 className="font-heading text-lg font-bold text-slate-800">
                    Re-Download Dokumen & Kartu Anggota
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Unduh ulang Kartu Member Digital (PNG) & Struk Pembayaran (PDF)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Digital Member Card Box */}
                <div className="flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      🪪 Kartu Member Digital
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Format PNG (9:16)
                    </span>
                  </div>

                  <DigitalMemberCard
                    member={{
                      username: selectedMember.username,
                      full_name: selectedMember.full_name,
                      email: selectedMember.email,
                      phone: selectedMember.phone,
                      membership_type: selectedMember.membership_type,
                      membership_start: selectedMember.membership_start,
                      membership_end: selectedMember.membership_end,
                    }}
                    branchName={selectedMember.branch_name}
                  />
                </div>

                {/* Struk / Receipt Re-download Box */}
                <div className="flex flex-col bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      🧾 Struk / Receipt Pembayaran
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Official Receipt
                    </span>
                  </div>

                  {memberTransactions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                        Pilih transaksi di bawah ini untuk melihat, mencetak, atau mengunduh ulang Struk Pembayaran Resmi:
                      </p>

                      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        {memberTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-[#007BFF]/10 text-[#007BFF] px-2 py-0.5 rounded font-mono">
                                  #{tx.transaction_number}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  {formatIDR(tx.total_amount)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold">
                                📅 {formatDateLabel(tx.transaction_date)} • {getMembershipTypeFromNotes(tx.notes || '')}
                              </p>
                              {tx.admin_name && (
                                <p className="text-[10px] text-slate-400">
                                  Kasir: {tx.admin_name}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  setReceiptTx(tx);
                                  setTimeout(() => {
                                    window.print();
                                  }, 100);
                                }}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#007BFF] hover:bg-[#0069D9] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak</span>
                              </button>
                              <button
                                onClick={() => setReceiptTx(tx)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-xs"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat Struk</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Belum ada riwayat transaksi pembayaran untuk anggota ini.
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono cursor-pointer"
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
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
