'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { Printer, ArrowLeft, CheckCircle, UserPlus, Check, RotateCcw } from 'lucide-react';
import { compressImage } from '@/utils/imageCompressor';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { DigitalMemberCard } from '@/components/core/DigitalMemberCard';
import { DatePicker } from '@/components/core/DatePicker';

import { packagesApi, membersApi } from '@/core/api';

interface SuccessData {
  member: any;
  username: string;
  password?: string;
  transactionNumber?: string;
  packageName: string;
  membershipStart: string;
  membershipEnd: string;
  paymentMethod: string;
  price: number;
}

export default function MemberRegistrationPage() {
  const { activeBranchID, user } = useAuth();
  const [packages, setPackages] = useState<{ name: string; price: number; days: number }[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageFetchError, setPackageFetchError] = useState<string | null>(null);

  // Form Personal Data states
  const [memberNumber, setMemberNumber] = useState('');
  const [loadingMemberNumber, setLoadingMemberNumber] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [address, setAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [loadingText, setLoadingText] = useState<string>('');

  // Form Package states
  const [packageName, setPackageName] = useState('');
  const [includeAdminFee, setIncludeAdminFee] = useState(true);
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Reactive dates
  const [startDateInput, setStartDateInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const fetchNextMemberCode = async () => {
    if (!activeBranchID) return;
    setLoadingMemberNumber(true);
    try {
      const res = await membersApi.getNextCode(activeBranchID);
      if (res.success && res.data?.next_code) {
        setMemberNumber(res.data.next_code);
      }
    } catch (err) {
      console.error('Gagal mengambil next member code:', err);
    } finally {
      setLoadingMemberNumber(false);
    }
  };

  const fetchDbPackages = async () => {
    setLoadingPackages(true);
    setPackageFetchError(null);
    try {
      const res = await packagesApi.listMembershipPackages(activeBranchID || undefined);
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map((p: any) => ({
          name: p.name,
          price: Number(p.price) || 0,
          days: Number(p.duration_days) || 30,
        }));
        setPackages(mapped);
      } else if (res.success && (!res.data || res.data.length === 0)) {
        setPackages([]);
        setPackageFetchError('Belum ada paket anggota yang aktif di sistem. Silakan tambahkan paket di menu Pengaturan Paket.');
      } else {
        setPackages([]);
        setPackageFetchError(res.error || 'Gagal memuat daftar paket anggota dari database.');
      }
    } catch (err: any) {
      console.error('Gagal mengambil data paket dari database:', err);
      setPackages([]);
      setPackageFetchError(err.message || 'Gagal terhubung ke database untuk memuat paket anggota.');
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    setStartDateInput(new Date().toISOString().split('T')[0]);
    fetchDbPackages();
    fetchNextMemberCode();
  }, [activeBranchID]);

  const selectedPkg = packages.find(p => p.name === packageName);
  const calculatedEnd = selectedPkg && startDateInput ? (() => {
    const d = new Date(startDateInput);
    d.setDate(d.getDate() + selectedPkg.days);
    return d.toISOString().split('T')[0];
  })() : '';

  const adminFee = includeAdminFee ? 50000 : 0;
  const basePrice = selectedPkg ? selectedPkg.price : 0;
  const subtotal = basePrice + adminFee;

  const discountAmount = (() => {
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) return 0;
    const num = Number(discountValue);
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, num));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.max(0, num));
  })();

  const totalPrice = Math.max(0, subtotal - discountAmount);
  const packageDesc = includeAdminFee ? `${packageName} (DAFTAR)` : packageName;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessData(null);

    if (!packageName || packages.length === 0) {
      setErrorMsg('Paket Anggota wajib dipilih dan tersedia sebelum mendaftarkan anggota!');
      return;
    }

    if (!fullName || !gender || !paymentMethod) {
      setErrorMsg('Harap lengkapi semua field bertanda wajib (Nama, Jenis Kelamin, Paket, Jenis Pembayaran)');
      return;
    }

    setLoading(true);
    setLoadingText('Mendaftarkan Anggota Baru...');

    // 1. Create member record FIRST in database
    const memberBody = {
      branch_id: activeBranchID,
      username: memberNumber ? memberNumber.trim() : undefined,
      full_name: fullName,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      date_of_birth: dob || undefined,
      gender,
      membership_type: packageDesc,
      membership_start: startDateInput,
      membership_end: calculatedEnd,
    };

    try {
      const memRes = await api.post<any>('/admin/members', memberBody);
      if (!memRes.success) {
        setErrorMsg(memRes.error || 'Gagal mendaftarkan anggota baru.');
        setLoading(false);
        return;
      }

      const createdMember = memRes.data.member;
      const username = memRes.data.username || memberNumber;
      const password = memRes.data.password;

      // 2. If member creation succeeded, upload photo to cloud (Cloudflare R2)
      let finalPhotoUrl = '';
      if (photoBase64) {
        try {
          setLoadingText('Proses Upload Foto ke Cloudflare R2...');
          finalPhotoUrl = await uploadToCloudflare(photoBase64, 'members');

          if (finalPhotoUrl) {
            setLoadingText('Mengupdate Foto Anggota...');
            await api.put(`/admin/members/${createdMember.id}`, {
              photo_url: finalPhotoUrl,
            });
            createdMember.photo_url = finalPhotoUrl;
          }
        } catch (err: any) {
          console.error('Gagal mengunggah foto ke Cloudflare R2:', err);
        }
      }

      // 3. Create the associated sales transaction
      setLoadingText('Menyimpan Transaksi...');
      const discountInfo = discountAmount > 0
        ? ` - Diskon: ${discountType === 'percent' ? `${discountValue}%` : `Rp ${discountAmount.toLocaleString('id-ID')}`} (-Rp ${discountAmount.toLocaleString('id-ID')})`
        : '';
      const txNotes = `Pendaftaran Anggota: ${fullName} - Paket: ${packageDesc}${discountInfo}${socialMedia ? ` - Sosial Media: ${socialMedia}` : ''}.${notes ? ` Catatan: ${notes}` : ''}`;
      const txBody = {
        member_id: createdMember.id,
        notes: txNotes.trim(),
        total_amount: totalPrice,
        payment_method: paymentMethod || 'Tunai',
        payment_amount: totalPrice,
        change_amount: 0,
        items: [],
      };

      const txRes = await api.post<any>('/admin/transactions', txBody);
      let txNumber = `RGS-MEM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`;
      if (txRes.success && txRes.data) {
        txNumber = txRes.data.transaction_number;
      }

      setSuccessData({
        member: createdMember,
        username,
        password,
        transactionNumber: txNumber,
        packageName: packageDesc,
        membershipStart: startDateInput,
        membershipEnd: calculatedEnd,
        paymentMethod: paymentMethod,
        price: totalPrice,
      });

      // Clear Form on success
      setFullName('');
      setGender('');
      setDob('');
      setPhone('');
      setEmail('');
      setSocialMedia('');
      setAddress('');
      setPhotoBase64('');
      setPackageName('');
      setDiscountType('nominal');
      setDiscountValue('');
      setPaymentMethod('');
      setNotes('');
      fetchNextMemberCode();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
          @page {
            size: auto;
            margin: 5mm !important;
          }
          header, aside, nav, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #receipt-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          #receipt-print-area {
            width: 100% !important;
            max-width: 100% !important;
            position: static !important;
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            color: black !important;
            font-weight: 700 !important;
          }
          thead th {
            background-color: #f2f2f2 !important;
            color: black !important;
            font-weight: 900 !important;
          }
          * {
            font-weight: 700 !important;
          }
        }
      `}</style>

      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h2 className="text-3xl font-heading text-slate-800 uppercase">PENDAFTARAN ANGGOTA</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran Baru & Transaksi Paket Keanggotaan Club Gym
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn no-print">
          {errorMsg}
        </div>
      )}

      {successData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action buttons (hidden on print) */}
          <div className="flex gap-4 no-print max-w-6xl mx-auto flex-wrap justify-between items-center">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-[#0069D9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Receipt
              </button>
              <Link
                href={`/dashboard/members/one-club?search=${encodeURIComponent(successData.username)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
              >
                Lihat Data Anggota
              </Link>
            </div>
            <button
              onClick={() => setSuccessData(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-[#C82333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Form
            </button>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Prabu Official Receipt Preview Container (Visible on print & screen preview) */}
            <div id="receipt-print-area" className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6 text-black print:border-0 print:p-0">

              {/* Header Box (Image 3) */}
              <div className="border border-black p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo-transparent.png"
                    alt="PRABU GYM Logo"
                    className="h-12 w-auto object-contain"
                  />
                  <div className="text-left leading-none">
                    <h1 className="text-2xl font-black tracking-widest font-heading">PRABU GYM</h1>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Gym & Fitness Center</span>
                  </div>
                </div>
                <div className="text-right border-l border-black pl-8 pr-4">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">OFFICIAL RECEIPT</h2>
                </div>
              </div>

              {/* Metadata Summary Row - Bold & Prominent */}
              <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-extrabold text-black uppercase tracking-wide">
                <span>Tanggal : {formatDateLabel(successData.membershipStart)}</span>
                <span>Kategori : Pendaftaran</span>
                <span>No Invoice : {successData.transactionNumber}</span>
              </div>

              {/* Main Details Table - Bold Header Row */}
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
                      <td className="py-3 px-3 border-r border-black font-mono font-bold">{successData.username}</td>
                      <td className="py-3 px-3 border-r border-black font-extrabold">{successData.member.full_name}</td>
                      <td className="py-3 px-3 border-r border-black uppercase text-[10px] font-bold">{successData.packageName}</td>
                      <td className="py-3 px-3 border-r border-black font-mono text-[10px] font-bold">
                        {formatDateLabel(successData.membershipStart)} s/d {formatDateLabel(successData.membershipEnd)}
                      </td>
                      <td className="py-3 px-3 border-r border-black uppercase font-bold">{successData.paymentMethod}</td>
                      <td className="py-3 px-3 font-extrabold">Rp. {successData.price.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Box (Image 3) */}
              <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
                <div>
                  <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Member</div>
                  <div className="h-28" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{successData.member.full_name}</div>
                </div>
                <div>
                  <div className="py-2 border-b border-black uppercase tracking-wider bg-slate-50 text-[10px]">Customer Service</div>
                  <div className="h-28" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{user?.full_name || 'Kasir PRABU GYM'}</div>
                </div>
              </div>

            </div>

            {/* Digital Membership Card (Hidden when printing receipt) */}
            <div className="no-print space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-bold uppercase text-slate-800 font-heading mb-4 text-center">
                  🪪 Kartu Anggota Digital
                </h3>
                <DigitalMemberCard
                  member={{
                    username: successData.username,
                    full_name: successData.member.full_name,
                    email: successData.member.email,
                    phone: successData.member.phone,
                    membership_type: successData.packageName,
                    membership_start: successData.membershipStart,
                    membership_end: successData.membershipEnd,
                  }}
                  branchCodeOrName={activeBranchID || undefined}
                  branchName={user?.branch_name}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Form - Full Width Grid Layout */}
      {!successData && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-visible w-full no-print">
          <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <UserPlus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Pendaftaran Anggota</span>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">

              <div className="space-y-5">
                {/* Tanggal Transaksi */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Tanggal Transaksi
                  </label>
                  <DatePicker
                    value={startDateInput}
                    onChange={setStartDateInput}
                  />
                </div>

                {/* Photo Input */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Foto Anggota
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="w-28 h-28 bg-slate-50 border border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs select-none relative overflow-hidden">
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Member" className="w-full h-full object-cover rounded" />
                      ) : (
                        'No Photo'
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded border border-slate-300 cursor-pointer transition-colors w-fit">
                        Pilih Gambar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                      {photoBase64 && (
                        <span className="text-[10px] text-blue-600 font-semibold">
                          ✓ Foto dipilih (Siap di-upload saat simpan)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nomor Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Nomor Anggota *
                  </label>
                  <div className="flex gap-2 items-center w-full">
                    <input
                      type="text"
                      required
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value)}
                      placeholder="Contoh: 16770001"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={fetchNextMemberCode}
                      disabled={loadingMemberNumber}
                      title="Generate nomor anggota otomatis berikutnya"
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded cursor-pointer transition-colors shrink-0 inline-flex items-center gap-1"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${loadingMemberNumber ? 'animate-spin' : ''}`} />
                      <span>Auto</span>
                    </button>
                  </div>
                </div>

                {/* Nama Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Nama Anggota *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan Nama Anggota"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-semibold"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Jenis Kelamin *
                  </label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Tanggal Lahir */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Tanggal Lahir
                  </label>
                  <DatePicker
                    value={dob}
                    onChange={(val) => setDob(val)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                {/* Nomor HP */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Nomor HP (Angka)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan Nomor HP (Contoh: 081234567890)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono"
                  />
                </div>

                {/* Email */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan Email"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded"
                  />
                </div>

                {/* Sosial Media */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center">
                    Sosial Media <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={socialMedia}
                    onChange={(e) => setSocialMedia(e.target.value)}
                    placeholder="Instagram / Facebook / Tiktok"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded"
                  />
                </div>

                {/* Alamat */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left mt-2 inline-flex items-center">
                    Alamat
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masukkan Alamat Lengkap"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded resize-none h-[72px]"
                  />
                </div>

                {/* Paket Anggota */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1 pt-4 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-700 text-left inline-flex items-center mt-2">
                    Paket Anggota <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="space-y-3 w-full">
                    <select
                      required
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
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
                      {packages.map((pkg, idx) => (
                        <option key={`${pkg.name}-${idx}`} value={pkg.name}>
                          {pkg.name} (Rp. {pkg.price.toLocaleString('id-ID')}) - {pkg.days} Hari
                        </option>
                      ))}
                    </select>

                    {/* Checkbox Biaya Admin / Pendaftaran */}
                    <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                      <input
                        type="checkbox"
                        id="includeAdminFee"
                        checked={includeAdminFee}
                        onChange={(e) => setIncludeAdminFee(e.target.checked)}
                        className="w-4 h-4 text-brand-cyan rounded border-slate-300 focus:ring-brand-cyan cursor-pointer"
                      />
                      <label htmlFor="includeAdminFee" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Biaya Pendaftaran / Admin (+Rp 50.000)
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium ml-auto">
                        {includeAdminFee ? 'Deskripsi: (DAFTAR)' : 'Tanpa biaya admin'}
                      </span>
                    </div>

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
                      onChange={(e) => setDiscountType(e.target.value as 'nominal' | 'percent')}
                      className="bg-slate-50 border border-slate-300 text-slate-800 px-3 py-2.5 text-xs focus:outline-none focus:border-brand-cyan rounded font-semibold shrink-0 cursor-pointer"
                    >
                      <option value="nominal">Nominal (Rp)</option>
                      <option value="percent">Persentase (%)</option>
                    </select>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? 100 : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percent' ? 'Contoh: 10 (untuk diskon 10%)' : 'Contoh: 50000 (untuk diskon Rp 50.000)'}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded font-mono font-semibold"
                      />
                      {discountAmount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600">
                          -Rp {discountAmount.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Jenis Pembayaran */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left">
                    Jenis Pembayaran *
                  </label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                  </select>
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
                            <span>(Paket: Rp {selectedPkg.price.toLocaleString('id-ID')}</span>
                            {includeAdminFee && <span>+ Admin: Rp 50.000</span>}
                            {discountAmount > 0 && (
                              <span className="text-emerald-600 font-bold">
                                - Diskon: {discountType === 'percent' ? `${discountValue}% (Rp ${discountAmount.toLocaleString('id-ID')})` : `Rp ${discountAmount.toLocaleString('id-ID')}`}
                              </span>
                            )}
                            <span>)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-28 text-xs font-semibold text-slate-600">Masa Aktif Dimulai:</span>
                        <div className="flex-1">
                          <DatePicker
                            value={startDateInput}
                            onChange={setStartDateInput}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-28 text-xs font-semibold text-slate-600">Masa Aktif Berakhir:</span>
                        <div className="flex-1">
                          <DatePicker
                            value={calculatedEnd}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keterangan */}
                <div className="grid grid-cols-[240px_1fr] gap-6 items-start max-sm:grid-cols-1">
                  <label className="text-sm font-bold text-slate-700 text-left mt-2">
                    Keterangan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan Keterangan Tambahan..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-cyan text-slate-800 px-3.5 py-2.5 text-xs focus:outline-none rounded resize-none h-[80px]"
                  />
                </div>

              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200/60">
                <button
                  type="submit"
                  disabled={loading || loadingPackages || !packageName || packages.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? (loadingText || 'Uploading Image & Menyimpan Transaksi...') : 'Simpan Transaksi'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
