'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';

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

export default function MemberRegistrationPage() {
  const { activeBranchID, user } = useAuth();

  // Form Personal Data states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [address, setAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');

  // Form Package states
  const [packageName, setPackageName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [clubType, setClubType] = useState('');
  const [notes, setNotes] = useState('');

  // Reactive dates
  const [startDateInput, setStartDateInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  useEffect(() => {
    setStartDateInput(new Date().toISOString().split('T')[0]);
  }, []);

  const selectedPkg = PACKAGES.find(p => p.name === packageName);
  const calculatedEnd = selectedPkg && startDateInput ? (() => {
    const d = new Date(startDateInput);
    d.setDate(d.getDate() + selectedPkg.days);
    return d.toISOString().split('T')[0];
  })() : '';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessData(null);

    if (!fullName || !gender || !packageName || !paymentMethod || !clubType) {
      setErrorMsg('Harap lengkapi semua field bertanda wajib');
      return;
    }

    setLoading(true);

    const price = selectedPkg ? selectedPkg.price : 0;

    // 1. Create the member record
    const memberBody = {
      branch_id: activeBranchID,
      full_name: fullName,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      date_of_birth: dob || undefined,
      gender,
      membership_type: `${packageName} (${clubType})`,
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
      const username = memRes.data.username;
      const password = memRes.data.password;

      // Update photo if uploaded
      if (photoBase64) {
        await api.put(`/admin/members/${createdMember.id}`, {
          ...memberBody,
          photo_url: photoBase64,
        });
      }

      // 2. Create the associated sales transaction
      const txNotes = `Pendaftaran Anggota: ${fullName} - Paket: ${packageName} (${clubType}) - Sosial Media: ${socialMedia}. Catatan: ${notes}`;
      const txBody = {
        member_id: createdMember.id,
        notes: txNotes.trim(),
        total_amount: price,
        items: [],
      };

      const txRes = await api.post<any>('/admin/transactions', txBody);
      let txNumber = 'PRABU-GRG-0000392';
      if (txRes.success && txRes.data) {
        txNumber = txRes.data.transaction_number;
      }

      setSuccessData({
        member: createdMember,
        username,
        password,
        transactionNumber: txNumber,
        packageName: packageName,
        membershipStart: startDateInput,
        membershipEnd: calculatedEnd,
        paymentMethod: paymentMethod,
        price: price,
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
      setPaymentMethod('');
      setClubType('');
      setNotes('');
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
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #receipt-print-area {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #receipt-print-area {
            width: 100% !important;
            position: absolute;
            left: 0;
            top: 0;
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

      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">PENDAFTARAN ANGGOTA</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran Baru & Transaksi Paket Keanggotaan Club Gym
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn no-print">
          ⚠️ {errorMsg}
        </div>
      )}

      {successData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action buttons (hidden on print) */}
          <div className="flex gap-4 no-print max-w-4xl mx-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Receipt
            </button>
            <button
              onClick={() => setSuccessData(null)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors cursor-pointer border border-slate-300/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Form
            </button>
          </div>

          {/* Prabu Official Receipt Preview Container (Visible on print & screen preview) */}
          <div id="receipt-print-area" className="bg-white border border-slate-200 p-8 rounded shadow-sm max-w-4xl mx-auto space-y-6 text-black print:border-0 print:p-0">
            
            {/* Header Box (Image 3) */}
            <div className="border border-black p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-12 h-12 text-[#DC3545]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 4l3 5 7-7 7 7 3-5v13H2V4zm0 15h20v2H2v-2z" />
                </svg>
                <div className="text-left leading-none">
                  <h1 className="text-2xl font-black tracking-widest">PRABU</h1>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Gym & Fitness Center</span>
                </div>
              </div>
              <div className="text-right border-l border-black pl-8 pr-4">
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">OFFICIAL RECEIPT</h2>
              </div>
            </div>

            {/* Metadata Summary Row */}
            <div className="border-t border-b border-black py-2.5 px-4 flex justify-between text-xs font-semibold">
              <span>Tanggal : {formatDateLabel(successData.membershipStart)}</span>
              <span>Kategori : Pendaftaran</span>
              <span>No Invoice : {successData.transactionNumber}</span>
            </div>

            {/* Main Details Table */}
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
                    <td className="py-3 px-3 border-r border-black font-mono">{successData.username}</td>
                    <td className="py-3 px-3 border-r border-black font-bold">{successData.member.full_name}</td>
                    <td className="py-3 px-3 border-r border-black uppercase text-[10px]">{successData.packageName}</td>
                    <td className="py-3 px-3 border-r border-black font-mono text-[10px]">
                      {formatDateLabel(successData.membershipStart)} s/d {formatDateLabel(successData.membershipEnd)}
                    </td>
                    <td className="py-3 px-3 border-r border-black uppercase">{successData.paymentMethod}</td>
                    <td className="py-3 px-3 font-bold">Rp. {successData.price.toLocaleString('id-ID')}</td>
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
                <div className="py-2 border-t border-black uppercase font-extrabold">{user?.full_name || 'Kasir Prabu GYM'}</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Registration Form */}
      {!successData && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 shadow-sm rounded space-y-6 no-print">
          
          {/* Section: Metadata */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="font-heading text-lg text-slate-800 uppercase tracking-wider">Transaksi Pendaftaran</h3>
            <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Tanggal Transaksi
                </label>
                <input
                  type="text"
                  disabled
                  value={todayFormatted}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 text-xs focus:outline-none font-mono rounded"
                />
              </div>
            </div>
          </div>

          {/* Section: Personal Info */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="font-heading text-lg text-slate-800 uppercase tracking-wider">Data Pribadi Anggota</h3>
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-400 text-xs select-none">
                    {photoBase64 ? (
                      <img src={photoBase64} alt="Member" className="w-full h-full object-cover rounded" />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200 cursor-pointer transition-colors">
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Nama Anggota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan Nama Anggota"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Masukkan Nomor HP"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan Email"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Sosial Media
                  </label>
                  <input
                    type="text"
                    value={socialMedia}
                    onChange={(e) => setSocialMedia(e.target.value)}
                    placeholder="Instagram / Facebook / Tiktok"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Alamat
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masukkan Alamat Lengkap"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body resize-none h-[72px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Package Details */}
          <div className="space-y-4 pb-6">
            <h3 className="font-heading text-lg text-slate-800 uppercase tracking-wider">Data Paket Anggota</h3>
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Paket Anggota <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  >
                    <option value="">-Pilih-</option>
                    {PACKAGES.map((pkg) => (
                      <option key={pkg.name} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Jenis Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  >
                    <option value="">-Pilih-</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Tipe Club <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={clubType}
                    onChange={(e) => setClubType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                  >
                    <option value="">-Pilih-</option>
                    <option value="One Club">One Club</option>
                    <option value="All Club">All Club</option>
                  </select>
                </div>

                {/* Selected Package Calculations block (Image 2) */}
                {selectedPkg && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3.5 animate-fadeIn">
                    <div className="grid grid-cols-[1.2fr_2fr] gap-4 items-center">
                      <span className="text-xs font-semibold text-slate-600 font-accent uppercase">Total Bayar</span>
                      <input
                        type="text"
                        readOnly
                        value={selectedPkg.price.toLocaleString('id-ID')}
                        className="bg-slate-100 border border-slate-200 text-slate-800 font-bold px-3 py-1.5 text-xs focus:outline-none rounded w-full"
                      />
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-4 items-center">
                      <span className="text-xs font-semibold text-slate-600 font-accent uppercase">Mulai Aktif</span>
                      <input
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 font-semibold px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                      />
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-4 items-center">
                      <span className="text-xs font-semibold text-slate-600 font-accent uppercase">Masa Aktif</span>
                      <input
                        type="date"
                        readOnly
                        value={calculatedEnd}
                        className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 text-xs focus:outline-none rounded w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Keterangan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masukkan Keterangan Tambahan..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body resize-none h-[155px]"
                />
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-accent font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer rounded shadow-sm"
            >
              {loading ? 'MENYIMPAN...' : '✓ Simpan Transaksi'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
