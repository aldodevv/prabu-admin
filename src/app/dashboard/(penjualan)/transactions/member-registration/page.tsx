'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function MemberRegistrationPage() {
  const { activeBranchID } = useAuth();

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

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    member: any;
    username: string;
    password?: string;
  } | null>(null);

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

  const calculateMembershipEnd = (start: Date, pkg: string): string => {
    const end = new Date(start.getTime());
    if (pkg === '1 Bulan' || pkg === '1 Bulan Perpanjang') {
      end.setMonth(end.getMonth() + 1);
    } else if (pkg === '1 Tahun') {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end.toISOString().split('T')[0];
  };

  const getPackagePrice = (pkg: string): number => {
    switch (pkg) {
      case '1 Bulan':
        return 350000;
      case '1 Tahun':
        return 3500000;
      case '1 Bulan Perpanjang':
        return 300000;
      default:
        return 0;
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

    const todayStr = new Date().toISOString().split('T')[0];
    const endStr = calculateMembershipEnd(new Date(), packageName);
    const price = getPackagePrice(packageName);

    // 1. Create the member record
    const memberBody = {
      branch_id: activeBranchID,
      full_name: fullName,
      email,
      phone,
      address,
      date_of_birth: dob,
      gender,
      membership_type: `${packageName} (${clubType})`,
      membership_start: todayStr,
      membership_end: endStr,
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

      const txRes = await api.post('/admin/transactions', txBody);
      if (!txRes.success) {
        console.warn('Member created but transaction log failed:', txRes.error);
      }

      setSuccessData({
        member: createdMember,
        username,
        password,
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

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">PENDAFTARAN ANGGOTA</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pendaftaran Baru & Transaksi Paket Keanggotaan Club Gym
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      {successData && (
        <div className="p-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 space-y-4 animate-fadeIn">
          <h3 className="font-heading text-lg font-bold">✓ PENDAFTARAN ANGGOTA BERHASIL!</h3>
          <p className="text-xs">
            Anggota dengan nama <strong>{successData.member.full_name}</strong> telah terdaftar. Berikut adalah kredensial login akun member:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 text-xs space-y-2 font-mono max-w-md rounded">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Username</span>
              <span className="text-slate-800 font-bold">@{successData.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Password</span>
              <span className="text-emerald-800 font-bold">{successData.password || '******'}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            *Silakan berikan informasi login ini kepada member.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 shadow-sm rounded space-y-6">
        
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
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Foto Anggota
                </label>
                <div className="flex items-center gap-4">
                  {photoBase64 ? (
                    <img
                      src={photoBase64}
                      alt="Preview"
                      className="w-20 h-20 object-cover border border-slate-200 rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs">
                      No Photo
                    </div>
                  )}
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer text-slate-700 rounded transition-all">
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
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
                  <option value="1 Bulan">1 Bulan (Rp 350.000)</option>
                  <option value="1 Tahun">1 Tahun (Rp 3.500.000)</option>
                  <option value="1 Bulan Perpanjang">1 Bulan Perpanjang (Rp 300.000)</option>
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
    </div>
  );
}
