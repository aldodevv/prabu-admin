'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Save, Printer, ArrowLeft, UserCheck } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  username: string;
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
  payment_method: string;
  total_amount: number;
  notes?: string;
}

export default function PTRegistrationPage() {
  const { activeBranchID, user } = useAuth();

  // Members & Trainers
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  // Form options grouping
  const [memberScope, setMemberScope] = useState<'one' | 'all'>('one');

  // Form Fields
  const [selectedMemberID, setSelectedMemberID] = useState('');
  const [selectedTrainerID, setSelectedTrainerID] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

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

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
      fetchTrainers();
    }
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, [activeBranchID, memberScope]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    setFetchError('');
    try {
      const url = memberScope === 'one'
        ? `/admin/members?branch_id=${activeBranchID}&per_page=200`
        : `/admin/members?per_page=200`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setMembers(res.data);
      } else {
        setFetchError(res.error || 'Gagal mengambil data anggota');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Terjadi kesalahan jaringan saat mengambil data anggota');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const res = await api.get<any>(`/admin/trainers?branch_id=${activeBranchID}`);
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

  // Recalculate sessions and prices based on selected package
  useEffect(() => {
    if (!selectedPackage) {
      setSessionCount(0);
      setTotalAmount(0);
      return;
    }

    if (selectedPackage.includes('Bonus 1 Sesi')) {
      setSessionCount(1);
      setTotalAmount(0);
    } else if (selectedPackage.includes('Bonus 2 Sesi')) {
      setSessionCount(2);
      setTotalAmount(0);
    } else if (selectedPackage.includes('PT 1 Sesi')) {
      setSessionCount(1);
      setTotalAmount(150000);
    } else if (selectedPackage.includes('PT 3 Sesi')) {
      setSessionCount(3);
      setTotalAmount(400000);
    } else if (selectedPackage.includes('PT 6 Sesi')) {
      setSessionCount(6);
      setTotalAmount(750000);
    } else if (selectedPackage.includes('PT 12 Sesi')) {
      setSessionCount(12);
      setTotalAmount(1200000);
    }
  }, [selectedPackage]);

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
      setErrorMsg('Semua field wajib diisi!');
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
      notes: notes || 'Pendaftaran PT',
    };

    try {
      const res = await api.post<any>('/admin/pt-registrations', body);
      if (res.success && res.data) {
        setSuccessTx({
          id: res.data.id,
          transaction_number: res.data.id ? `PRABU-PT-GRG-${res.data.id.substring(0, 7).toUpperCase()}` : 'PRABU-PT-GRG-0000001',
          member_id: selectedMemberID,
          member_name: memberObj?.full_name || 'Member',
          member_username: memberObj?.username || 'Member',
          trainer_id: selectedTrainerID,
          trainer_name: trainerObj?.full_name || 'Trainer',
          package_name: selectedPackage,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          notes: notes,
        });

        setSelectedMemberID('');
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

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 font-sans">
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #pt-receipt-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #pt-receipt-print-area {
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

      {/* Form Container (Hidden on receipt printing) */}
      <div className="no-print space-y-6 w-full">
        <div>
          <h2 className="text-3xl font-heading text-slate-800 uppercase">PENDAFTARAN PERSONAL TRAINER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran & Transaksi Paket Latihan Mandiri dengan Pelatih
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
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Pendaftaran Personal Trainer</span>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-700 w-full">
              <div className="space-y-5">
                {/* Tanggal Transaksi */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Tanggal Transaksi</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={todayFormatted}
                    className="bg-slate-100 border border-slate-300 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                  />
                </div>

                {/* Kelompok Anggota Toggle */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Kelompok Anggota</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={memberScope === 'one'}
                        onChange={() => setMemberScope('one')}
                        className="text-[#17A2B8] focus:ring-[#17A2B8]"
                      />
                      <span className="text-xs font-bold text-slate-700">One Club (Cabang Aktif)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={memberScope === 'all'}
                        onChange={() => setMemberScope('all')}
                        className="text-[#17A2B8] focus:ring-[#17A2B8]"
                      />
                      <span className="text-xs font-bold text-slate-700">All Club (Semua Cabang)</span>
                    </label>
                  </div>
                </div>

                {/* Nama Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Nama Anggota *
                  </label>
                  <div className="relative w-full">
                    <select
                      required
                      disabled={loadingMembers}
                      value={selectedMemberID}
                      onChange={(e) => setSelectedMemberID(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full disabled:opacity-50"
                    >
                      <option value="">{loadingMembers ? 'Memuat data anggota...' : '-Pilih-'}</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.username} / {m.full_name}
                        </option>
                      ))}
                    </select>
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
                      <option value="">{loadingTrainers ? 'Memuat data pelatih...' : '-Pilih-'}</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Paket Latihan Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Paket Latihan Anggota *</label>
                  <select
                    required
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-bold"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Bonus 1 Sesi PT - Promo januari (free)">Bonus 1 Sesi PT - Promo januari (free)</option>
                    <option value="Bonus 2 Sesi PT - Promo januari (free)">Bonus 2 Sesi PT - Promo januari (free)</option>
                    <option value="PT 1 Sesi [Harga 150k]">PT 1 Sesi [Harga 150k]</option>
                    <option value="PT 3 Sesi [Harga 400k]">PT 3 Sesi [Harga 400k]</option>
                    <option value="PT 6 Sesi [Harga 750k]">PT 6 Sesi [Harga 750k]</option>
                    <option value="PT 12 Sesi [Harga 1200k]">PT 12 Sesi [Harga 1200k]</option>
                  </select>
                </div>

                {/* Conditional fields based on Package selection */}
                {selectedPackage && (
                  <>
                    {/* Jumlah Sesi */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left">Jumlah Sesi</label>
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
                      <label className="text-sm font-bold text-slate-700 text-left">Total Bayar</label>
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
                      <label className="text-sm font-bold text-slate-700 text-left">Mulai Gym</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#17A2B8] rounded w-full font-bold cursor-pointer"
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch { } }}
                      />
                    </div>

                    {/* Masa Aktif */}
                    <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                      <label className="text-sm font-bold text-slate-700 text-left">Masa Aktif</label>
                      <input
                        type="date"
                        readOnly
                        disabled
                        value={endDate}
                        className="bg-slate-100 border border-slate-300 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Jenis Pembayaran */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">Jenis Pembayaran *</label>
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
                  <label className="text-sm font-bold text-slate-700 text-left mt-2">Keterangan</label>
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
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'MEMPROSES...' : 'Simpan Transaksi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Receipt View overlay (Renders after transaction creation) */}
      {successTx && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
          {/* Action buttons (hidden on print) */}
          <div className="flex gap-4 no-print">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007BFF] hover:bg-[#0069D9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Receipt
            </button>
            <button
              onClick={() => setSuccessTx(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC3545] hover:bg-[#C82333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Form
            </button>
          </div>

          {/* Prabu Official Receipt Container (Visible on print & screen preview) */}
          <div id="pt-receipt-print-area" className="bg-white border border-black p-8 rounded text-black space-y-6 max-w-4xl mx-auto print:border-0 print:p-0">

            {/* Header Box */}
            <div className="grid grid-cols-[1.2fr_2fr] border border-black divide-x divide-black">
              {/* Logo Box */}
              <div className="p-4 flex flex-col items-center justify-center text-center">
                <img
                  src="/logo-transparent.png"
                  alt="Prabu Gym Logo"
                  className="h-14 w-auto object-contain"
                />
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
              <span>Kategori : Personal Trainner</span>
              <span>No Invoice : {successTx.transaction_number}</span>
            </div>

            {/* Details Table */}
            <div className="border border-black overflow-hidden rounded-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3 border-r border-black">Nomor Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Nama Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Paket Anggota</th>
                    <th className="py-2.5 px-3 border-r border-black">Jumlah Sesi</th>
                    <th className="py-2.5 px-3 border-r border-black">Masa Aktif</th>
                    <th className="py-2.5 px-3">Harga Paket</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold text-slate-800">
                    <td className="py-3 px-3 border-r border-black font-mono">{successTx.member_username}</td>
                    <td className="py-3 px-3 border-r border-black font-bold">{successTx.member_name}</td>
                    <td className="py-3 px-3 border-r border-black uppercase text-[10px]">{successTx.package_name}</td>
                    <td className="py-3 px-3 border-r border-black text-center">{sessionCount}</td>
                    <td className="py-3 px-3 border-r border-black font-mono text-[10px]">{formatDateLabel(endDate)}</td>
                    <td className="py-3 px-3 font-bold">Rp. {successTx.total_amount.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Box (Three signature columns: Member, PT, CS) */}
            <div className="grid grid-cols-3 border border-black text-center text-xs font-bold divide-x divide-black">
              <div>
                <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Member</div>
                <div className="h-28" />
                <div className="py-2 border-t border-black uppercase font-extrabold">{successTx.member_name}</div>
              </div>
              <div>
                <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Personal Trainner</div>
                <div className="h-28" />
                <div className="py-2 border-t border-black uppercase font-extrabold">{successTx.trainer_name}</div>
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
