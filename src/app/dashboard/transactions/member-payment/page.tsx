'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { permissions } from '@/lib/permissions';
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
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<string>('');
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

  const selectedPkg = packages.find(p => p.name === selectedPackageName);
  const basePrice = selectedPkg ? selectedPkg.price : 0;

  const discountAmount = (() => {
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) return 0;
    const num = Number(discountValue);
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, num));
      return Math.round((basePrice * pct) / 100);
    }
    return Math.min(basePrice, Math.max(0, num));
  })();

  const totalPrice = Math.max(0, basePrice - discountAmount);

  const handleOpenPayment = (m: Member) => {
    if (m.branch_id !== activeBranchID) {
      if (permissions.canManageBranchTransfer(user?.role)) {
        const confirmChange = window.confirm(
          `Pembayaran tidak diperkenankan. Member tersebut terdaftar di cabang ${m.branch_name || 'lain'}.\n\nApakah Anda ingin melakukan Pergantian Cabang untuk member ini?`
        );
        if (confirmChange) {
          router.push('/dashboard/transactions/card-replacement');
        }
      } else {
        alert(
          `Pembayaran tidak diperkenankan. Member tersebut terdaftar di cabang ${m.branch_name || 'lain'}.\n\nPergantian cabang hanya dapat diproses oleh Owner, Admin, atau Developer.`
        );
      }
      return;
    }

    setSelectedMember(m);
    setSelectedPackageName('');
    setDiscountType('nominal');
    setDiscountValue('');
    setPaymentMethod('');
    setNotes('');
    setErrorMsg('');
    setSuccessTx(null);

    // Calculate start date: if expired or inactive, start today. If active, start day after expiry
    const today = new Date();
    const expiry = m.membership_end ? new Date(m.membership_end) : null;
    let start = today;
    const isStillActive = m.is_active && expiry && expiry >= today;
    if (isStillActive && expiry) {
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
    const discountInfo = discountAmount > 0
      ? ` - Diskon: ${discountType === 'percent' ? `${discountValue}%` : `Rp ${discountAmount.toLocaleString('id-ID')}`} (-Rp ${discountAmount.toLocaleString('id-ID')})`
      : '';
    const txNotes = `Perpanjang Paket: ${selectedPackageName}${discountInfo} - Metode: ${paymentMethod}.${notes ? ` Catatan: ${notes}` : ''}`;
    const txBody = {
      member_id: selectedMember.id,
      notes: txNotes.trim(),
      total_amount: totalPrice,
      payment_method: paymentMethod || 'Tunai',
      payment_amount: totalPrice,
      change_amount: 0,
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
          totalAmount: totalPrice,
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
      (m.is_active && isMemberActive(m.membership_end)) ? 'Aktif' : 'Tidak Aktif',
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
        const active = m.is_active && isMemberActive(m.membership_end);
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
          @page {
            size: auto;
            margin: 3mm 5mm !important;
          }
          header, aside, nav, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-renewal-receipt {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-renewal-receipt {
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            visibility: visible !important;
            position: static !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          .receipt-meta-row span,
          .receipt-table th,
          .receipt-table td {
            white-space: nowrap !important;
          }
          th, td {
            color: black !important;
            font-weight: 700 !important;
          }
          thead th {
            background-color: #f8fafc !important;
            color: black !important;
            font-weight: 900 !important;
          }
          * {
            font-weight: 700 !important;
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
              loading={loading}
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
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-visible w-full no-print animate-fadeIn">
            {/* Header cyan bar */}
            <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider font-heading">Transaksi Pembayaran Anggota</span>
            </div>

            {errorMsg && (
              <div className="m-6 mb-0 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="p-6 md:p-8">
              <form onSubmit={handleSavePayment} className="space-y-6 w-full">
                <div className="space-y-5">

                  {/* Tanggal Transaksi */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Tanggal Transaksi
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={todayFormatted}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-600 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-bold"
                    />
                  </div>

                  {/* Nomor Anggota */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Nomor Anggota
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedMember.username}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-600 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-bold"
                    />
                  </div>

                  {/* Nama Anggota */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Nama Anggota
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedMember.full_name}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-semibold"
                    />
                  </div>

                  {/* Masa Aktif Terakhir */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Masa Aktif Terakhir
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={selectedMember.membership_end ? formatDateLabel(selectedMember.membership_end) : '-'}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-600 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-bold"
                    />
                  </div>

                  {/* Selisih */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Selisih
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={calculateDaysDiffLabel(selectedMember.membership_end)}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-600 px-3.5 py-2.5 text-xs focus:outline-none rounded font-bold"
                    />
                  </div>

                  {/* Paket Anggota (Dropdown from DB) */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1 pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center mt-2">
                      Paket Anggota <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-3 w-full">
                      <select
                        required
                        value={selectedPackageName}
                        onChange={(e) => setSelectedPackageName(e.target.value)}
                        disabled={loadingPackages || packages.length === 0}
                        className={`w-full bg-slate-50 border ${packageFetchError ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                          } focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-bold disabled:opacity-60 disabled:cursor-not-allowed`}
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

                  {/* Diskon */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Diskon <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                    </label>
                    <div className="flex gap-2 items-center w-full">
                      <select
                        value={discountType}
                        onChange={(e) => {
                          setDiscountType(e.target.value as 'nominal' | 'percent');
                          setDiscountValue('');
                        }}
                        className="bg-slate-50 border border-slate-300 text-slate-800 px-3 py-2.5 text-xs focus:outline-none focus:border-brand-cyan rounded font-semibold shrink-0 cursor-pointer"
                      >
                        <option value="nominal">Nominal (Rp)</option>
                        <option value="percent">Persentase (%)</option>
                      </select>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={
                            discountType === 'nominal'
                              ? (discountValue ? Number(discountValue).toLocaleString('id-ID') : '')
                              : discountValue
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            if (discountType === 'percent') {
                              const num = Number(raw);
                              setDiscountValue(raw === '' ? '' : String(Math.min(100, num)));
                            } else {
                              setDiscountValue(raw);
                            }
                          }}
                          placeholder={discountType === 'percent' ? 'Contoh: 10 (untuk diskon 10%)' : 'mis. 50.000 (untuk diskon Rp 50.000)'}
                          className={`w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-semibold ${
                            discountAmount > 0 ? 'pr-28' : ''
                          }`}
                        />
                        {discountAmount > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600 pointer-events-none">
                            -Rp {discountAmount.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Masa Aktif Mulai */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Masa Aktif Mulai <span className="text-red-500 ml-1">*</span>
                    </label>
                    <DatePicker
                      value={newStartDate}
                      onChange={setNewStartDate}
                      placeholder="Pilih Tanggal Mulai"
                    />
                  </div>

                  {/* Masa Aktif Berakhir */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Masa Aktif Berakhir <span className="text-red-500 ml-1">*</span>
                    </label>
                    <DatePicker
                      value={newEndDate}
                      onChange={setNewEndDate}
                      placeholder="Pilih Tanggal Berakhir"
                    />
                  </div>

                  {/* Selected Package Details */}
                  {selectedPkg && (
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1 bg-slate-50 p-4 border border-slate-200 rounded">
                      <label className="text-sm font-bold text-slate-700 text-left">
                        Rincian Paket
                      </label>
                      <div className="space-y-3 w-full">
                        <div className="flex items-center gap-4">
                          <span className="w-28 text-xs font-semibold text-slate-600">Total Bayar:</span>
                          <div className="flex-1 flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`Rp. ${totalPrice.toLocaleString('id-ID')}`}
                              className="bg-slate-100 border border-slate-200 text-slate-800 font-black px-3 py-1.5 text-xs rounded"
                            />
                            <div className="text-[10px] text-slate-500 font-semibold flex flex-wrap gap-1 items-center">
                              <span>(Paket: Rp {selectedPkg.price.toLocaleString('id-ID')} - {selectedPkg.days} Hari</span>
                              {discountAmount > 0 && (
                                <span className="text-emerald-600 font-bold">
                                  - Diskon: {discountType === 'percent' ? `${discountValue}% (Rp ${discountAmount.toLocaleString('id-ID')})` : `Rp ${discountAmount.toLocaleString('id-ID')}`}
                                </span>
                              )}
                              <span>)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Jenis Pembayaran */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                      Jenis Pembayaran <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded"
                    >
                      <option value="">-Pilih-</option>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>

                  {/* Keterangan */}
                  <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                    <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center mt-2">
                      Keterangan
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Masukkan Keterangan (Opsional)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded resize-none h-[72px]"
                    />
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                    <button
                      type="submit"
                      disabled={submitting || loadingPackages || !selectedPackageName || packages.length === 0}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{submitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('list')}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer transition-colors"
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
          <div id="print-renewal-receipt" className="bg-white border border-slate-200 p-6 md:p-8 rounded shadow-sm space-y-4 print:space-y-3 text-black max-w-4xl mx-auto print:border-0 print:p-0">

            {/* Header Box */}
            <div className="grid grid-cols-[1.1fr_2fr] border border-black divide-x divide-black">
              {/* Logo Box */}
              <div className="p-3 print:p-2 flex flex-col items-center justify-center text-center">
                <img
                  src="/logo-transparent.png"
                  alt="PRABU GYM Logo"
                  className="h-10 print:h-9 w-auto object-contain"
                />
                <div className="text-center leading-none mt-1">
                  <h1 className="text-lg print:text-base font-bold tracking-widest font-heading text-black">PRABU GYM</h1>
                  <span className="text-[8px] print:text-[7.5px] uppercase font-bold text-black tracking-wider">Gym &amp; Fitness Center</span>
                </div>
              </div>

              {/* Title Box */}
              <div className="p-3 print:p-2 flex items-center justify-center text-center">
                <h2 className="text-xl print:text-lg font-bold uppercase tracking-wider text-black">
                  PRABU OFFICIAL RECEIPT
                </h2>
              </div>
            </div>

            {/* Metadata Summary Row - Single line, zero wrapping */}
            <div className="receipt-meta-row border-t border-b border-black py-2 print:py-1.5 px-3 flex justify-between items-center text-[11px] print:text-[9.5px] font-bold text-black uppercase tracking-tight whitespace-nowrap">
              <span className="whitespace-nowrap">Tanggal : {formatDateLabel(new Date().toISOString())}</span>
              <span className="whitespace-nowrap">Kategori : Perpanjang</span>
              <span className="whitespace-nowrap">No Invoice : {successTx.txNumber}</span>
            </div>

            {/* Details Table - Bold Header Row */}
            <div className="border border-black overflow-hidden rounded-xs">
              <table className="receipt-table w-full text-left text-xs print:text-[9.5px] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-black font-bold uppercase text-[10px] print:text-[8.5px] text-black">
                    <th className="py-2 px-1.5 border-r border-black font-bold text-center w-[18%] whitespace-nowrap">NOMOR ANGGOTA</th>
                    <th className="py-2 px-2 border-r border-black font-bold text-left w-[22%] whitespace-nowrap">NAMA ANGGOTA</th>
                    <th className="py-2 px-2 border-r border-black font-bold text-center w-[18%] whitespace-nowrap">PAKET ANGGOTA</th>
                    <th className="py-2 px-2 border-r border-black font-bold text-center w-[16%] whitespace-nowrap">MASA AKTIF</th>
                    <th className="py-2 px-1.5 border-r border-black font-bold text-center w-[12%] whitespace-nowrap">METODE</th>
                    <th className="py-2 px-2 font-bold text-right w-[14%] whitespace-nowrap">HARGA PAKET</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-black text-xs print:text-[9.5px]">
                    <td className="py-2.5 px-1.5 border-r border-black font-bold text-center font-mono whitespace-nowrap truncate">{selectedMember.username}</td>
                    <td className="py-2.5 px-2 border-r border-black font-bold text-left truncate">{selectedMember.full_name}</td>
                    <td className="py-2.5 px-2 border-r border-black uppercase font-bold text-center whitespace-nowrap">{successTx.packageName}</td>
                    <td className="py-2 px-1 border-r border-black font-bold text-center font-mono text-[9.5px] print:text-[8px] leading-tight">
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span>{formatDateLabel(successTx.newStart)}</span>
                        <span className="text-[7.5px] print:text-[7px] font-sans font-normal opacity-75">s/d</span>
                        <span>{formatDateLabel(successTx.newEnd)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-1.5 border-r border-black uppercase font-bold text-center whitespace-nowrap">{successTx.paymentMethod}</td>
                    <td className="py-2.5 px-2 font-bold text-right font-mono whitespace-nowrap">Rp. {successTx.totalAmount.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Box */}
            <div className="grid grid-cols-2 border border-black text-center text-xs print:text-[9.5px] font-bold divide-x divide-black">
              <div>
                <div className="py-1.5 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px] print:text-[8.5px] font-bold text-black">MEMBER</div>
                <div className="h-20 print:h-16" />
                <div className="py-1.5 border-t border-black uppercase font-bold text-black truncate px-1">{selectedMember.full_name}</div>
              </div>
              <div>
                <div className="py-1.5 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px] print:text-[8.5px] font-bold text-black">CUSTOMER SERVICE</div>
                <div className="h-20 print:h-16" />
                <div className="py-1.5 border-t border-black uppercase font-bold text-black truncate px-1">{user?.full_name || 'Kasir PRABU GYM'}</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
