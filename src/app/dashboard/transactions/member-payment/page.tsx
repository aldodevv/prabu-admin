'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Search, UserPlus, Trash, ArrowLeft, Save, Printer, FileText } from 'lucide-react';

interface Member {
  id: string;
  branch_id: string;
  branch_name: string;
  username: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type: string;
  membership_start: string;
  membership_end: string;
  is_active: boolean;
  created_at: string;
}

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

const PACKAGES = [
  { name: '1 bulan', price: 250000, days: 30 },
  { name: '1 bulan (daftar)', price: 200000, days: 30 },
  { name: '1 bulan (perpanjang)', price: 250000, days: 30 },
  { name: '3 bulan', price: 600000, days: 90 },
  { name: '3 bulan - Promo Januari', price: 600000, days: 90 },
  { name: '3 bulan (daftar) - Promo Januari', price: 555000, days: 90 },
  { name: '6 bulan', price: 1200000, days: 180 },
  { name: '6 bulan - Promo Januari', price: 1250000, days: 180 },
  { name: '6 bulan (daftar) - Promo Januari', price: 1100000, days: 180 },
  { name: '12 bulan', price: 2200000, days: 365 },
  { name: '12 bulan - Promo Januari', price: 2270000, days: 365 },
  { name: '12 bulan (daftar)', price: 1180000, days: 365 }
];

export default function MemberPaymentPage() {
  const { activeBranchID, user } = useAuth();

  // Steps: 'list' | 'pay'
  const [step, setStep] = useState<'list' | 'pay'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Data lists
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('Semua');
  const [memberScope, setMemberScope] = useState<'one' | 'all'>('one');

  // Form Fields
  const [selectedPackageName, setSelectedPackageName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [clubType, setClubType] = useState('');
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

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
    }
  }, [activeBranchID, memberScope]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const url = memberScope === 'one'
        ? `/admin/members?branch_id=${activeBranchID}&per_page=200`
        : `/admin/members?per_page=200`;
      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (m: Member) => {
    setSelectedMember(m);
    setSelectedPackageName('');
    setPaymentMethod('');
    setClubType('');
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
    const pkg = PACKAGES.find(p => p.name === selectedPackageName);
    if (!pkg) return;

    const d = new Date(newStartDate);
    d.setDate(d.getDate() + pkg.days);
    setNewEndDate(d.toISOString().split('T')[0]);
  }, [selectedPackageName, newStartDate]);

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
        return `${years} year, ${days} days`;
      }
      return `${diffDays} days`;
    } else {
      // Remaining
      const remainingDays = Math.abs(diffDays);
      return `${remainingDays} days left`;
    }
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
    if (!selectedMember || !selectedPackageName || !paymentMethod || !clubType) {
      setErrorMsg('Semua field wajib diisi!');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    const pkg = PACKAGES.find(p => p.name === selectedPackageName);
    if (!pkg) return;

    // Step 1: Create transaction record (Kategori: Perpanjang)
    const txNotes = `Perpanjang Paket: ${selectedPackageName} - Metode: ${paymentMethod} (${clubType}). Catatan: ${notes}`;
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

  const handleDeleteMember = async (m: Member) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan membership ${m.full_name}?`)) return;
    try {
      const res = await api.delete<any>(`/admin/members/${m.id}`);
      if (res.success) {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredMembers = () => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        m.full_name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      if (selectedMemberFilter !== 'Semua') {
        return matchQuery && m.id === selectedMemberFilter;
      }
      return matchQuery;
    });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedMemberFilter('Semua');
  };

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

            {/* Pencari Box (Image 1 Layout) */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider">Pencari</span>
              </div>
              <div className="p-6">
                <div className="flex gap-4 flex-wrap items-center">
                  <div className="relative min-w-[280px]">
                    <select
                      value={selectedMemberFilter}
                      onChange={(e) => setSelectedMemberFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-bold uppercase"
                    >
                      <option value="Semua">-Pilih-</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.username} | {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Cari nama atau HP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded min-w-[200px]"
                  />

                  <button
                    onClick={fetchMembers}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Pencarian</span>
                  </button>
                  <button
                    onClick={handleResetSearch}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tampilkan Semua</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            {loading ? (
              <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
                Loading data anggota...
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
                  <span className="text-sm uppercase tracking-wider font-heading">Pembayaran Anggota</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Scope filter buttons (checkmark) */}
                  <div className="flex gap-2 select-none">
                    <button
                      onClick={() => setMemberScope('one')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded border cursor-pointer transition-all ${memberScope === 'one'
                          ? 'bg-[#007BFF] border-[#007BFF] text-white'
                          : 'bg-white border-slate-300 text-slate-650 hover:bg-slate-50'
                        }`}
                    >
                      ✓ One Club
                    </button>
                    <button
                      onClick={() => setMemberScope('all')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded border cursor-pointer transition-all ${memberScope === 'all'
                          ? 'bg-[#007BFF] border-[#007BFF] text-white'
                          : 'bg-white border-slate-300 text-slate-650 hover:bg-slate-50'
                        }`}
                    >
                      ✓ All Club
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-650 border border-slate-200">
                      <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                        <tr>
                          <th className="py-3 px-4 border-r border-slate-350/40 w-12 text-center">No</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Masa Aktif</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nomor Anggota</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nama Anggota</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Kontak</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Paket Fitnes</th>
                          <th className="py-3 px-4 border-r border-slate-350/40 text-center">Status Anggota</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-xs">
                        {getFilteredMembers().length > 0 ? (
                          getFilteredMembers().map((m, idx) => {
                            const active = isMemberActive(m.membership_end);
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 border-r border-slate-100 text-center">{idx + 1}</td>
                                <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-600">
                                  {formatDateLabel(m.membership_end)}
                                </td>
                                <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-800">@{m.username}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-slate-800 font-bold">{m.full_name}</td>
                                <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-600">{m.phone || '-'}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-slate-700 uppercase text-[10px]">{m.membership_type}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-center select-none">
                                  {active ? (
                                    <span className="inline-block px-2.5 py-1 bg-[#28A745] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
                                      Aktif
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 bg-[#DC3545] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
                                      Tidak Aktif
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-center select-none">
                                  <div className="flex flex-col gap-1 items-center justify-center">
                                    <button
                                      onClick={() => handleOpenPayment(m)}
                                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#28A745] hover:bg-[#218838] border border-[#28A745] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-xs"
                                    >
                                      + Pembayaran
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMember(m)}
                                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 border border-[#DC3545] text-[#DC3545] font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-xs"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold select-none uppercase">
                              Tidak ada data anggota ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Payment/Renewal Form */}
        {step === 'pay' && selectedMember && !successTx && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {/* Header cyan bar */}
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
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

                {/* Paket Anggota (Dropdown same as registration) */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Paket Anggota *</label>
                  <select
                    required
                    value={selectedPackageName}
                    onChange={(e) => setSelectedPackageName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold"
                  >
                    <option value="">-Pilih-</option>
                    {PACKAGES.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} [Harga {(p.price / 1000)}k]
                      </option>
                    ))}
                  </select>
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

                {/* Tipe Club */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tipe Club *</label>
                  <select
                    required
                    value={clubType}
                    onChange={(e) => setClubType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="">-Pilih-</option>
                    <option value="One Club">One Club</option>
                    <option value="All Club">All Club</option>
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
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-sm cursor-pointer"
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
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer shadow-sm"
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
                <svg className="w-14 h-14 text-red-650" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 4l3 5 7-7 7 7 3-5v13H2V4zm0 15h20v2H2v-2z" />
                </svg>
                <div className="text-center leading-none mt-2">
                  <h1 className="text-xl font-black tracking-widest">PRABU</h1>
                  <span className="text-[8px] uppercase font-bold text-slate-500">Gym & Fitness Center</span>
                </div>
              </div>

              {/* Title Box */}
              <div className="p-4 flex items-center justify-center text-center">
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-800">
                  PRABU OFFICIAL RECEIPT
                </h2>
              </div>
            </div>

            {/* Metadata Summary Row */}
            <div className="border border-black py-2.5 px-4 flex justify-between text-xs font-semibold">
              <span>Tanggal : {formatDateLabel(new Date().toISOString())}</span>
              <span>Kategori : Perpanjang</span>
              <span>No Invoice : {successTx.txNumber}</span>
            </div>

            {/* Details Table */}
            <div className="border border-black overflow-hidden rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3 border-r border-black">Nomor Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Nama Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Paket Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Masa Aktif</th>
                    <th className="py-2.5 px-3 border-r border-black">Jenis Pembayaran</th>
                    <th className="py-2.5 px-3">Harga Paket</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold text-slate-800">
                    <td className="py-3 px-3 border-r border-black font-mono">@{selectedMember.username}</td>
                    <td className="py-3 px-3 border-r border-black font-bold">{selectedMember.full_name}</td>
                    <td className="py-3 px-3 border-r border-black uppercase text-[10px]">{successTx.packageName}</td>
                    <td className="py-3 px-3 border-r border-black font-mono text-[10px]">
                      {formatDateLabel(successTx.newStart)} s/d {formatDateLabel(successTx.newEnd)}
                    </td>
                    <td className="py-3 px-3 border-r border-black uppercase">{successTx.paymentMethod}</td>
                    <td className="py-3 px-3 font-bold">Rp. {successTx.totalAmount.toLocaleString('id-ID')}</td>
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
                <div className="py-2 border-t border-black uppercase font-extrabold">{user?.full_name || 'Kasir Prabu GYM'}</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
