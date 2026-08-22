'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Save, Printer, ArrowLeft, UserCheck, Search, Check, X, Phone } from 'lucide-react';

import { packagesApi } from '@/core/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DatePicker } from '@/components/core/DatePicker';
import FieldInfo from '@/components/core/FieldInfo';
import { OfficialPTReceiptTemplate } from '@/components/core/PrintTemplates';

interface Member {
  id: string;
  full_name: string;
  username: string;
  phone?: string;
  branch_id: string;
}

interface Trainer {
  id: string;
  full_name: string;
}

interface PTRegistration {
  id: string;
  transaction_number?: string;
  member_id: string;
  member_name: string;
  member_username?: string;
  trainer_id: string;
  trainer_name: string;
  package_name: string;
  session_count?: number;
  membership_end?: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
}

export default function PTRegistrationPage() {
  const { activeBranchID, user } = useAuth();

  // Role permissions
  const canEditTransactionDate = user?.role === 'owner' || user?.role === 'developer';

  // Members & Trainers & Dynamic Packages
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberObj, setSelectedMemberObj] = useState<Member | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [ptPackagesList, setPtPackagesList] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageFetchError, setPackageFetchError] = useState<string | null>(null);

  // Form Fields
  const [transactionDate, setTransactionDate] = useState('');
  const [selectedMemberID, setSelectedMemberID] = useState('');
  const [selectedTrainerID, setSelectedTrainerID] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  // Member Search State with Debounce (Min 4 chars)
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const debouncedMemberSearch = useDebounce(memberSearchQuery, 400);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberComboboxRef = useRef<HTMLDivElement>(null);

  // Auto-calculated fields
  const [sessionCount, setSessionCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [endDate, setEndDate] = useState('');

  // Loading states for data fetching
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState<PTRegistration | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Close member search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (memberComboboxRef.current && !memberComboboxRef.current.contains(e.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTransactionDate(today);
    setStartDate(today);

    if (activeBranchID) {
      fetchTrainers();
      fetchPtPackages();
    }
  }, [activeBranchID]);

  // Debounced search for members: only hits API when length >= 4
  useEffect(() => {
    if (!activeBranchID) return;
    const q = debouncedMemberSearch.trim();
    if (q.length >= 4) {
      searchMembers(q);
    } else {
      setMembers([]);
    }
  }, [debouncedMemberSearch, activeBranchID]);

  const searchMembers = async (query: string) => {
    setLoadingMembers(true);
    setFetchError('');
    try {
      const res = await api.get<any>(`/admin/members?branch_id=${activeBranchID}&search=${encodeURIComponent(query)}&per_page=50`);
      if (res.success && res.data) {
        setMembers(res.data);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchPtPackages = async () => {
    setLoadingPackages(true);
    setPackageFetchError(null);
    try {
      const res = await packagesApi.listPTPackages(activeBranchID || undefined);
      if (res.success && res.data && res.data.length > 0) {
        setPtPackagesList(res.data);
      } else if (res.success && (!res.data || res.data.length === 0)) {
        setPtPackagesList([]);
        setPackageFetchError('Belum ada paket Personal Trainer yang aktif di sistem.');
      } else {
        setPtPackagesList([]);
        setPackageFetchError(res.error || 'Gagal memuat daftar paket Personal Trainer.');
      }
    } catch (err: any) {
      console.error('Gagal mengambil paket PT dari DB:', err);
      setPtPackagesList([]);
      setPackageFetchError(err.message || 'Gagal terhubung ke server untuk memuat paket PT.');
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const res = await api.get<any>('/admin/trainers');
      if (res.success && res.data) {
        setTrainers(res.data);
      } else {
        setFetchError(prev => prev ? `${prev} | ${res.error}` : (res.error || 'Gagal mengambil data pelatih'));
      }
    } catch (err: any) {
      setFetchError(prev => prev ? `${prev} | ${err.message}` : (err.message || 'Terjadi kesalahan jaringan saat mengambil data pelatih'));
    } finally {
      setLoadingTrainers(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter((m) => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q)
    );
  });

  // Recalculate sessions and prices based on selected package
  useEffect(() => {
    if (!selectedPackage) {
      setSessionCount(0);
      setTotalAmount(0);
      return;
    }

    const matched = ptPackagesList.find(p => p.name === selectedPackage || selectedPackage.includes(p.name));
    if (matched) {
      setSessionCount(matched.session_count || 1);
      setTotalAmount(Number(matched.price) || 0);
    } else {
      setSessionCount(1);
      setTotalAmount(0);
    }
  }, [selectedPackage, ptPackagesList]);

  // Recalculate expiry date: exactly 1 month minus 1 day from Start Gym
  useEffect(() => {
    if (!startDate) {
      setEndDate('');
      return;
    }
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(d.getDate() - 1);
    setEndDate(d.toISOString().split('T')[0]);
  }, [startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberID || !selectedTrainerID || !selectedPackage || !paymentMethod) {
      setErrorMsg('Semua field bertanda wajib harus diisi!');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const memberObj = members.find(m => m.id === selectedMemberID);
    const trainerObj = trainers.find(t => t.id === selectedTrainerID);

    const body = {
      member_id: selectedMemberID,
      trainer_id: selectedTrainerID,
      package_name: selectedPackage,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      registration_date: transactionDate || new Date().toISOString().split('T')[0],
      notes: notes || 'Pendaftaran PT',
    };

    try {
      const res = await api.post<any>('/admin/pt-registrations', body);
      if (res.success && res.data) {
        setSuccessTx({
          id: res.data.id,
          transaction_number: res.data.transaction_number || `RGS-TRA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
          member_id: selectedMemberID,
          member_name: memberObj?.full_name || 'Member',
          member_username: memberObj?.username || 'Member',
          trainer_id: selectedTrainerID,
          trainer_name: trainerObj?.full_name || 'Trainer',
          package_name: selectedPackage,
          session_count: sessionCount,
          membership_end: endDate,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          notes: notes,
        });

        setSelectedMemberID('');
        setMemberSearchQuery('');
        setSelectedTrainerID('');
        setSelectedPackage('');
        setPaymentMethod('');
        setNotes('');
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan transaksi PT.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6">

      {/* Main Registration Form Container */}
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase font-heading">
            Pendaftaran Personal Trainer
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Pendaftaran &amp; Transaksi Paket Latihan Mandiri dengan Pelatih
          </p>
        </div>

        {fetchError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn">
            ⚠️ Gagal Memuat Data: {fetchError}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded shadow-sm w-full overflow-hidden">
          <div className="bg-brand-cyan px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Pendaftaran Personal Trainer</span>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-700 w-full">
              <div className="space-y-5">
                {/* Tanggal Transaksi */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Tanggal Transaksi
                    <FieldInfo text="Default hari ini dan akses penggantian tanggal hanya bisa di lakukan oleh owner." />
                  </label>
                  <div className="w-full">
                    <DatePicker
                      value={transactionDate}
                      onChange={(val) => {
                        if (canEditTransactionDate) {
                          setTransactionDate(val);
                        }
                      }}
                      readOnly={!canEditTransactionDate}
                      disabled={!canEditTransactionDate}
                    />
                  </div>
                </div>

                {/* Nama Anggota (Searchable Combobox) */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center mt-2">
                    Nama Anggota <span className="text-red-500 ml-1">*</span>
                    <FieldInfo text="Ketik minimal 4 karakter (nama atau nomor anggota) untuk mencari data member." />
                  </label>

                  <div className="w-full relative" ref={memberComboboxRef}>
                    {selectedMemberObj ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm uppercase shrink-0">
                            {selectedMemberObj.full_name.charAt(0) || 'M'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{selectedMemberObj.full_name}</span>
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                                No. {selectedMemberObj.username}
                              </span>
                            </div>
                            {selectedMemberObj.phone && (
                              <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{selectedMemberObj.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberID('');
                            setSelectedMemberObj(null);
                            setMemberSearchQuery('');
                            setIsMemberDropdownOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-colors cursor-pointer"
                        >
                          Ganti Anggota ✕
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={memberSearchQuery}
                            onChange={(e) => {
                              setMemberSearchQuery(e.target.value);
                              setIsMemberDropdownOpen(true);
                            }}
                            onFocus={() => setIsMemberDropdownOpen(true)}
                            placeholder={loadingMembers ? "Mencari data anggota..." : "Ketik minimal 4 karakter (nama / nomor anggota)..."}
                            className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 pl-9 pr-8 py-2.5 text-xs focus:outline-none rounded"
                          />
                          {memberSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setMemberSearchQuery('');
                                setMembers([]);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {isMemberDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100 animate-fadeIn">
                            {memberSearchQuery.trim().length < 4 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                Ketik minimal 4 karakter (nama atau nomor) untuk mencari anggota...
                              </div>
                            ) : loadingMembers ? (
                              <div className="p-3 text-center text-xs text-slate-500">Mencari data anggota...</div>
                            ) : members.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-500">
                                Tidak ada anggota ditemukan dengan kata kunci &quot;{memberSearchQuery}&quot;
                              </div>
                            ) : (
                              members.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMemberID(m.id);
                                    setSelectedMemberObj(m);
                                    setMemberSearchQuery('');
                                    setIsMemberDropdownOpen(false);
                                  }}
                                  className="w-full text-left p-2.5 hover:bg-cyan-50/50 flex items-center justify-between transition-colors cursor-pointer group"
                                >
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-brand-cyan block">
                                      {m.full_name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                      <span>No: {m.username}</span>
                                      {m.phone && <span>• {m.phone}</span>}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-cyan uppercase">
                                    Pilih →
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nama Pelatih */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Nama Pelatih *
                  </label>
                  <div className="relative w-full">
                    <select
                      required
                      disabled={loadingTrainers}
                      value={selectedTrainerID}
                      onChange={(e) => setSelectedTrainerID(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full disabled:opacity-50"
                    >
                      <option value="">{loadingTrainers ? 'Memuat data pelatih...' : '-Pilih Pelatih-'}</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Paket Latihan Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center mt-2">
                    Paket Latihan Anggota *
                    <FieldInfo text="Wajib memilih dari daftar paket Personal Trainer aktif." />
                  </label>
                  <div className="space-y-2 w-full">
                    <select
                      required
                      value={selectedPackage}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                      disabled={loadingPackages || ptPackagesList.length === 0}
                      className={`bg-slate-50 border ${
                        packageFetchError ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                      } text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-bold disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {loadingPackages
                          ? '⏳ Memuat daftar paket PT...'
                          : ptPackagesList.length === 0
                          ? '-- Tidak Ada Paket Tersedia --'
                          : '-Pilih Paket PT-'}
                      </option>
                      {ptPackagesList.map((pkg: any, idx: number) => (
                        <option key={pkg.id || `${pkg.name}-${idx}`} value={pkg.name}>
                          {pkg.name} {pkg.price > 0 ? `[Harga Rp. ${Number(pkg.price).toLocaleString('id-ID')}]` : '(Free)'} - {pkg.session_count || 1} Sesi
                        </option>
                      ))}
                    </select>

                    {packageFetchError && (
                      <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs animate-fadeIn">
                        <span className="flex items-center gap-1.5 font-medium">
                          ⚠️ {packageFetchError}
                        </span>
                        <button
                          type="button"
                          onClick={fetchPtPackages}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditional fields based on Package selection */}
                {selectedPackage && (
                  <>
                    {/* Jumlah Sesi */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                        Jumlah Sesi
                        <FieldInfo text="Total kuota sesi pertemuan latihan yang didapatkan." />
                      </label>
                      <input
                        type="number"
                        readOnly
                        disabled
                        value={sessionCount}
                        className="bg-slate-100 border border-slate-300 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                      />
                    </div>

                    {/* Total Bayar */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                        Total Bayar
                        <FieldInfo text="Total nominal biaya paket pendaftaran latihan PT." />
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`Rp. ${totalAmount.toLocaleString('id-ID')}`}
                        className="bg-slate-100 border border-slate-300 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                      />
                    </div>

                    {/* Mulai Gym */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                        Mulai Gym
                        <FieldInfo text="Pilih tanggal pertama kali dimulainya sesi latihan." />
                      </label>
                      <DatePicker
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                      />
                    </div>

                    {/* Masa Aktif */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                        Masa Aktif Berakhir
                        <FieldInfo text="Tanggal otomatis kadaluarsa/berakhirnya masa aktif paket." />
                      </label>
                      <DatePicker
                        value={endDate}
                        readOnly
                      />
                    </div>
                  </>
                )}

                {/* Jenis Pembayaran */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Jenis Pembayaran *
                    <FieldInfo text="Wajib memilih metode pembayaran (Tunai, Transfer, QRIS, atau Debit)." />
                  </label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left mt-2 inline-flex items-center">
                    Keterangan
                    <FieldInfo text="Catatan khusus atau keterangan tambahan (opsional)." />
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukan Keterangan"
                    rows={4}
                    className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full resize-none h-[100px]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                <button
                  type="submit"
                  disabled={loading || !selectedMemberID || !selectedTrainerID || !selectedPackage || !paymentMethod}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'MEMPROSES...' : 'Simpan Transaksi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Official PT Receipt Modal Overlay */}
      {successTx && (
        <OfficialPTReceiptTemplate
          onClose={() => setSuccessTx(null)}
          data={{
            transactionNumber: successTx.transaction_number || `RGS-TRA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
            transactionDate: new Date().toISOString(),
            memberUsername: successTx.member_username || '-',
            memberName: successTx.member_name,
            packageName: successTx.package_name,
            sessionCount: successTx.session_count ?? 1,
            membershipEnd: successTx.membership_end || endDate,
            paymentMethod: successTx.payment_method,
            price: successTx.total_amount,
            trainerName: successTx.trainer_name,
            cashierName: user?.full_name || 'Kasir Prabu GYM',
          }}
        />
      )}

    </div>
  );
}
