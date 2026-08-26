'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { membersApi, packagesApi } from '@/core/api';
import { Member } from '@/core/types';
import { Search, UserPlus, Trash, ArrowLeft, Save, Printer, FileText, PlusCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/lib/excelExport';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { DatePicker } from '@/components/core/DatePicker';

interface Transaction {
  id: string;
  transaction_number: string;
  member_id?: string;
  member_name?: string;
  admin_name: string;
  transaction_date: string;
  total_amount: number;
  notes?: string;
}

export default function MemberPaymentPage() {
  const { activeBranchID, user } = useAuth();
  const router = useRouter();

  // Steps: 'list' | 'pay'
  const [step, setStep] = useState<'list' | 'pay'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Data lists & Pagination states
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Dynamic Packages states
  const [packages, setPackages] = useState<{ name: string; price: number; days: number }[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageFetchError, setPackageFetchError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [isTyping, setIsTyping] = useState(false);

  // Form Fields
  const [selectedPackageName, setSelectedPackageName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Date calculations
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [successTx, setSuccessTx] = useState<{
    txNumber: string;
    packageName: string;
    totalAmount: number;
    paymentMethod: string;
    newStart: string;
    newEnd: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset page when search or branch changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeBranchID]);

  const fetchDbPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await packagesApi.listMembershipPackages(activeBranchID || undefined);
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map((p: any) => ({
          name: p.name,
          price: Number(p.price) || 0,
          days: Number(p.duration_days) || 30,
        }));
        setPackages(mapped);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data paket membership:', err);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchDbPackages();
  }, [page, perPage, debouncedSearch, filterColumn, activeBranchID]);

  const fetchMembers = async () => {
    if (!activeBranchID) return;
    setLoading(true);
    try {
      const pageNum = Number(page) || 1;
      const perPageNum = Number(perPage) || 50;
      const search = debouncedSearch.trim();

      const res = await membersApi.list({
        branch_id: activeBranchID,
        search: search || undefined,
        page: pageNum,
        per_page: perPageNum,
      });
      if (res.success && res.data) {
        setMembers(res.data);
        setTotal(res.meta?.total || (res.data ? res.data.length : 0));
      } else {
        setMembers([]);
        setTotal(0);
      }
    } catch (err) {
      console.error(err);
      setMembers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (m: Member) => {
    if (m.branch_id !== activeBranchID) {
      const confirmChange = window.confirm(
        `Pembayaran tidak diperkenankan. Member tersebut terdaftar di cabang ${m.branch_name || 'lain'}.\n\nApakah Anda ingin melakukan Pergantian Cabang untuk member ini?`
      );
      if (confirmChange) {
        router.push('/dashboard/transactions/card-replacement');
      }
      return;
    }

    setSelectedMember(m);
    setSelectedPackageName('');
    setPaymentMethod('');
    setNotes('');
    setErrorMsg('');
    setSuccessTx(null);

    // Calculate start date: if expired, start today. If active, start day after expiry
    const today = new Date();
    const expiry = m.membership_end ? new Date(m.membership_end) : null;
    let start = today;
    if (expiry && expiry >= today) {
      start = new Date(expiry);
      start.setDate(start.getDate() + 1);
    }
    setNewStartDate(start.toISOString().split('T')[0]);
    setStep('pay');
  };

  // Recalculate end date based on selected package days
  useEffect(() => {
    if (!selectedPackageName || !newStartDate) {
      setNewEndDate('');
      return;
    }
    const pkg = packages.find(p => p.name === selectedPackageName);
    if (!pkg) return;

    const d = new Date(newStartDate);
    d.setDate(d.getDate() + pkg.days);
    setNewEndDate(d.toISOString().split('T')[0]);
  }, [selectedPackageName, newStartDate, packages]);

  const calculateDaysDiffLabel = (dateStr?: string) => {
    if (!dateStr) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - expiry.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      // Expired
      if (diffDays > 365) {
        const years = Math.floor(diffDays / 365);
        const days = diffDays % 365;
        return `${years} thn ${days} hr`;
      }
      return `${diffDays} hari`;
    } else if (diffDays < 0) {
      // Active
      const remainingDays = Math.abs(diffDays);
      if (remainingDays > 365) {
        const years = Math.floor(remainingDays / 365);
        const days = remainingDays % 365;
        return `${years} thn ${days} hr`;
      }
      return `${remainingDays} hari`;
    }
    return 'Hari Ini';
  };

  const isMemberActive = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    return expiry >= today;
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedPackageName || !paymentMethod) {
      setErrorMsg('Semua field wajib diisi!');
      return;
    }

    const pkg = packages.find(p => p.name === selectedPackageName);
    if (!pkg) {
      setErrorMsg('Paket yang dipilih tidak valid atau belum tersedia!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    // Step 1: Create transaction record (Kategori: Perpanjang)
    const txNotes = `Perpanjang Paket: ${selectedPackageName} - Metode: ${paymentMethod}.${notes ? ` Catatan: ${notes}` : ''}`;
    const txBody = {
      member_id: selectedMember.id,
      notes: txNotes.trim(),
      total_amount: pkg.price,
      items: [],
    };

    try {
      const txRes = await api.post<any>('/admin/transactions', txBody);
      if (!txRes.success || !txRes.data) {
        setErrorMsg(txRes.error || 'Gagal membuat log transaksi pembayaran.');
        setSubmitting(false);
        return;
      }

      // Step 2: Update member membership dates in DB ("nyambung ke data pendaftaran anggota")
      const memberUpdateBody = {
        username: selectedMember.username,
        full_name: selectedMember.full_name,
        email: selectedMember.email || '',
        phone: selectedMember.phone || '',
        address: selectedMember.address || '',
        date_of_birth: selectedMember.date_of_birth || '',
        gender: selectedMember.gender || 'Laki-laki',
        membership_type: selectedPackageName,
        membership_start: newStartDate,
        membership_end: newEndDate,
        is_active: true,
      };

      const memberRes = await api.put<any>(`/admin/members/${selectedMember.id}`, memberUpdateBody);
      if (memberRes.success) {
        // Prepare data for the Official Receipt
        const invoiceNum = txRes.data.transaction_number
          ? txRes.data.transaction_number.replace('TRX', 'PRABU-GRG-RN')
          : `PRABU-GRG-RN-${Date.now().toString().substring(6)}`;

        setSuccessTx({
          txNumber: invoiceNum,
          packageName: selectedPackageName,
          totalAmount: pkg.price,
          paymentMethod: paymentMethod,
          newStart: newStartDate,
          newEnd: newEndDate,
        });

        // Refresh list
        fetchMembers();
      } else {
        setErrorMsg(memberRes.error || 'Gagal memperbarui masa aktif membership anggota.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (m: Member) => {
    if (user?.role === 'cs' || user?.role === 'karyawan') {
      alert('Anda tidak memiliki izin untuk menghapus data pembayaran.');
      return;
    }
    if (
      !confirm(
        `Apakah Anda yakin ingin membatalkan dan menghapus data pembayaran terakhir untuk anggota:\n${m.full_name} (${m.username})?\n\nCatatan: Data akun anggota TIDAK akan terhapus, hanya riwayat transaksi pembayaran terakhir yang dibatalkan.`
      )
    ) {
      return;
    }
    try {
      const res = await api.delete<any>(`/admin/members/${m.id}/last-payment`);
      if (res.success) {
        fetchMembers();
      } else {
        alert(res.error || 'Gagal menghapus data pembayaran.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan jaringan.');
    }
  };

  // Handle typing state
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchQuery, debouncedSearch]);

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilterColumn('');
    setPage(1);
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nomor Anggota', 'Nama Anggota', 'Masa Aktif Selesai', 'Kontak HP', 'Paket Fitnes', 'Status Anggota'];
    const data = members.map((m, index) => [
      index + 1,
      m.username,
      m.full_name,
      formatDateLabel(m.membership_end),
      m.phone || '-',
      m.membership_type || '-',
      isMemberActive(m.membership_end) ? 'Aktif' : 'Tidak Aktif',
    ]);

    exportToExcel({
      filename: `Data_Pembayaran_Anggota_${new Date().toISOString().split('T')[0]}`,
      title: 'DATA PEMBAYARAN & PERPANJANGAN ANGGOTA - PRABU GYM',
      headers,
      data,
    });
  };

  const columnOptions = [
    { label: 'Semua Kolom', value: '' },
    { label: 'Nomor Anggota', value: 'username' },
    { label: 'Nama Anggota', value: 'full_name' },
    { label: 'Kontak HP', value: 'phone' },
    { label: 'Paket Fitnes', value: 'membership_type' },
  ];

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const columns: Column<Member>[] = [
    {
      key: 'index',
      header: 'No',
      align: 'center',
      className: 'w-12 text-center border-r border-slate-100',
      render: (_, idx) => idx + 1,
    },
    {
      key: 'membership_end',
      header: 'Masa Aktif',
      className: 'border-r border-slate-100 font-mono text-slate-600',
      render: (m) => formatDateLabel(m.membership_end),
    },
    {
      key: 'username',
      header: 'Nomor Anggota',
      className: 'border-r border-slate-100 font-mono text-slate-800',
      render: (m) => m.username,
    },
    {
      key: 'full_name',
      header: 'Nama Anggota',
      className: 'border-r border-slate-100 text-slate-800 font-bold',
      render: (m) => m.full_name,
    },
    {
      key: 'phone',
      header: 'Kontak',
      className: 'border-r border-slate-100 font-mono text-slate-600',
      render: (m) => m.phone || '-',
    },
    {
      key: 'membership_type',
      header: 'Paket Fitnes',
      className: 'border-r border-slate-100 text-slate-700 uppercase text-[10px]',
      render: (m) => m.membership_type || '-',
    },
    {
      key: 'status',
      header: 'Status Anggota',
      align: 'center',
      className: 'border-r border-slate-100 text-center select-none',
      render: (m) => {
        const active = isMemberActive(m.membership_end);
        return active ? (
          <span className="inline-block px-2.5 py-1 bg-[#28A745] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
            Aktif
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 bg-[#DC3545] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
            Tidak Aktif
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      className: 'text-center select-none w-24',
      render: (m) => {
        const canDelete = user?.role === 'developer' || user?.role === 'owner' || user?.role === 'admin';
        return (
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => handleOpenPayment(m)}
              title="Proses Pembayaran / Perpanjangan"
              className="p-2 bg-brand-cyan hover:bg-[#138496] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            {canDelete && (
              <button
                onClick={() => handleDeletePayment(m)}
                title="Hapus Data Pembayaran Terakhir (Akun Anggota Tidak Dihapus)"
                className="p-2 bg-[#DC3545] hover:bg-[#C82333] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 font-sans">

      {/* Absolute CSS print layouts */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-renewal-receipt {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-renewal-receipt {
            width: 100% !important;
            display: block !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Main dashboard screens wrapped in no-print */}
      <div className="no-print space-y-6">

        {/* Step 1: Member Table Listing */}
        {step === 'list' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-heading text-slate-800">PEMBAYARAN ANGGOTA</h2>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
                Perpanjangan Membership & Pengelolaan Riwayat Pembayaran Anggota
              </p>
            </div>

            {/* Search Box */}
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Ketik nama, nomor anggota, atau kontak HP..."
              columnOptions={columnOptions}
              selectedColumn={filterColumn}
              onColumnChange={setFilterColumn}
              isTyping={isTyping}
              onReset={handleResetSearch}
            />

            {/* Table Container with Server-side Pagination */}
            <DataTable
              title="Pembayaran Anggota"
              columns={columns}
              data={members}
              loading={loading}
              loadingMessage="Loading data anggota..."
              emptyMessage="Tidak ada data anggota ditemukan."
              currentPage={page}
              totalItems={total}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={(val) => {
                setPerPage(val);
                setPage(1);
              }}
            />
          </div>
        )}

        {/* Step 2: Payment/Renewal Form */}
        {step === 'pay' && selectedMember && !successTx && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {/* Header cyan bar */}
            <div className="bg-brand-cyan px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
              <span className="text-sm uppercase tracking-wider font-heading">Transaksi Pembayaran Anggota</span>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
              <form onSubmit={handleSavePayment} className="space-y-6 text-sm text-slate-700">

                {/* Tanggal Transaksi */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tanggal Transaksi</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={todayFormatted}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                  />
                </div>

                {/* Nomor Anggota */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor Anggota</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedMember.username}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                  />
                </div>

                {/* Nama Anggota */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedMember.full_name}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                  />
                </div>

                {/* Masa Aktif Terakhir */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Masa Aktif Terakhir</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedMember.membership_end || '-'}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono"
                  />
                </div>

                {/* Selisih */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Selisih</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={calculateDaysDiffLabel(selectedMember.membership_end)}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                  />
                </div>

                {/* Paket Anggota (Dropdown from DB) */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent mt-2">
                    Paket Anggota *
                  </label>
                  <div className="space-y-2 w-full">
                    <select
                      required
                      value={selectedPackageName}
                      onChange={(e) => setSelectedPackageName(e.target.value)}
                      disabled={loadingPackages || packages.length === 0}
                      className={`bg-slate-50 border ${packageFetchError ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                        } text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {loadingPackages
                          ? '⏳ Memuat daftar paket anggota...'
                          : packages.length === 0
                            ? '-- Tidak Ada Paket Tersedia --'
                            : '-Pilih Paket Anggota-'}
                      </option>
                      {packages.map((p, idx) => (
                        <option key={`${p.name}-${idx}`} value={p.name}>
                          {p.name} (Rp. {p.price.toLocaleString('id-ID')}) - {p.days} Hari
                        </option>
                      ))}
                    </select>

                    {/* Error / info alert directly beneath the input */}
                    {packageFetchError && (
                      <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs animate-fadeIn">
                        <span className="flex items-center gap-1.5 font-medium">
                          ⚠️ {packageFetchError}
                        </span>
                        <button
                          type="button"
                          onClick={fetchDbPackages}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Masa Aktif Mulai */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                    Masa Aktif Mulai *
                  </label>
                  <DatePicker
                    value={newStartDate}
                    onChange={setNewStartDate}
                    placeholder="Pilih Tanggal Mulai"
                  />
                </div>

                {/* Masa Aktif Berakhir */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                    Masa Aktif Berakhir *
                  </label>
                  <div className="space-y-1.5 w-full">
                    <DatePicker
                      value={newEndDate}
                      onChange={setNewEndDate}
                      placeholder="Pilih Tanggal Berakhir"
                    />
                    {selectedPackageName && packages.find((p) => p.name === selectedPackageName) && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                        <span>
                          Durasi Paket:{' '}
                          <strong className="text-brand-cyan">
                            +{packages.find((p) => p.name === selectedPackageName)?.days} Hari
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Total:{' '}
                          <strong className="text-slate-800">
                            Rp.{' '}
                            {packages
                              .find((p) => p.name === selectedPackageName)
                              ?.price.toLocaleString('id-ID')}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Jenis Pembayaran */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Jenis Pembayaran *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Keterangan</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukan Keterangan"
                    rows={4}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full resize-none h-[80px]"
                  />
                </div>

                {/* Form Action */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1 pt-4 border-t border-slate-100">
                  <div />
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting || loadingPackages || !selectedPackageName || packages.length === 0}
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('list')}
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-sm cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

      {/* Success Renewal Receipt (Image 3 Layout) */}
      {successTx && selectedMember && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
          {/* Action buttons (hidden on print) */}
          <div className="flex gap-4 no-print select-none">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Receipt
            </button>
            <button
              onClick={() => {
                setSuccessTx(null);
                setStep('list');
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer border border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Tabel
            </button>
          </div>

          {/* Struk Container */}
          <div id="print-renewal-receipt" className="bg-white border border-black p-8 rounded text-black space-y-6 max-w-4xl mx-auto print:border-0 print:p-0">

            {/* Header Box */}
            <div className="grid grid-cols-[1.2fr_2fr] border border-black divide-x divide-black">
              {/* Logo Box */}
              <div className="p-4 flex flex-col items-center justify-center text-center">
                <img
                  src="/logo-transparent.png"
                  alt="PRABU GYM Logo"
                  className="h-14 w-auto object-contain"
                />
                <div className="text-center leading-none mt-2">
                  <h1 className="text-xl font-black tracking-widest font-heading">PRABU GYM</h1>
                  <span className="text-[8px] uppercase font-bold text-slate-600 tracking-wider">Gym & Fitness Center</span>
                </div>
              </div>

              {/* Title Box */}
              <div className="p-4 flex items-center justify-center text-center">
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900">
                  PRABU OFFICIAL RECEIPT
                </h2>
              </div>
            </div>

            {/* Metadata Summary Row - Bold & Prominent */}
            <div className="border border-black py-2.5 px-4 flex justify-between text-xs font-extrabold text-black uppercase tracking-wide">
              <span>Tanggal : {formatDateLabel(new Date().toISOString())}</span>
              <span>Kategori : Perpanjang</span>
              <span>No Invoice : {successTx.txNumber}</span>
            </div>

            {/* Details Table - Bold Header Row */}
            <div className="border border-black overflow-hidden rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-black uppercase text-[11px] text-black">
                    <th className="py-2.5 px-3 border-r border-black font-black">NOMOR ANGGOTA</th>
                    <th className="py-2.5 px-3 border-r border-black font-black">NAMA ANGGOTA</th>
                    <th className="py-2.5 px-3 border-r border-black font-black">PAKET ANGGOTA</th>
                    <th className="py-2.5 px-3 border-r border-black font-black">MASA AKTIF</th>
                    <th className="py-2.5 px-3 border-r border-black font-black">JENIS PEMBAYARAN</th>
                    <th className="py-2.5 px-3 font-black">HARGA PAKET</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-slate-900">
                    <td className="py-3 px-3 border-r border-black font-mono font-bold">{selectedMember.username}</td>
                    <td className="py-3 px-3 border-r border-black font-extrabold">{selectedMember.full_name}</td>
                    <td className="py-3 px-3 border-r border-black uppercase text-[10px] font-bold">{successTx.packageName}</td>
                    <td className="py-3 px-3 border-r border-black font-mono text-[10px] font-bold">
                      {formatDateLabel(successTx.newStart)} s/d {formatDateLabel(successTx.newEnd)}
                    </td>
                    <td className="py-3 px-3 border-r border-black uppercase font-bold">{successTx.paymentMethod}</td>
                    <td className="py-3 px-3 font-extrabold">Rp. {successTx.totalAmount.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Box */}
            <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
              <div>
                <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Member</div>
                <div className="h-28" />
                <div className="py-2 border-t border-black uppercase font-extrabold">{selectedMember.full_name}</div>
              </div>
              <div>
                <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Customer Service</div>
                <div className="h-28" />
                <div className="py-2 border-t border-black uppercase font-extrabold">{user?.full_name || 'Kasir PRABU GYM'}</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
