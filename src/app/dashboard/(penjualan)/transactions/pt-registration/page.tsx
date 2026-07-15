'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Member {
  id: string;
  full_name: string;
  username: string;
}

interface Trainer {
  id: string;
  full_name: string;
}

export default function PTRegistrationPage() {
  const { activeBranchID } = useAuth();

  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Form Fields
  const [memberID, setMemberID] = useState('');
  const [trainerID, setTrainerID] = useState('');
  const [packageName, setPackageName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchLists();
    }
  }, [activeBranchID]);

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const [memRes, trainRes] = await Promise.all([
        api.get<any>(`/admin/members?branch_id=${activeBranchID}&per_page=200&active_only=true`),
        api.get<any>(`/admin/trainers?branch_id=${activeBranchID}`),
      ]);

      if (memRes.success && memRes.data) {
        setMembers(memRes.data);
      }
      if (trainRes.success && trainRes.data) {
        setTrainers(trainRes.data.filter((t: any) => t.is_active));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat daftar member/pelatih.');
    } finally {
      setLoadingLists(false);
    }
  };

  const getPackagePrice = (pkg: string): number => {
    switch (pkg) {
      case '10 Sesi':
        return 1500000;
      case '20 Sesi':
        return 2800000;
      case '30 Sesi':
        return 3900000;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!memberID || !trainerID || !packageName || !paymentMethod) {
      setErrorMsg('Harap lengkapi semua field bertanda wajib');
      return;
    }

    setLoading(true);
    const price = getPackagePrice(packageName);

    const body = {
      member_id: memberID,
      trainer_id: trainerID,
      package_name: packageName,
      payment_method: paymentMethod,
      total_amount: price,
      notes,
    };

    try {
      const res = await api.post('/admin/pt-registrations', body);
      if (res.success) {
        setSuccessMsg('Pendaftaran latihan personal trainer berhasil disimpan!');
        // Clear Form
        setMemberID('');
        setTrainerID('');
        setPackageName('');
        setPaymentMethod('');
        setNotes('');
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan transaksi pendaftaran.');
      }
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
      <div>
        <h2 className="text-3xl font-heading text-slate-800">PENDAFTARAN PERSONAL TRAINER</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Pendaftaran Latihan / Sesi Personal Trainer (PT) Mandiri
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider animate-fadeIn">
          ✓ {successMsg}
        </div>
      )}

      {loadingLists ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Sinkronisasi data pelatih & member...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 max-w-4xl space-y-5 rounded shadow-sm">
          <h3 className="font-heading text-xl text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3.5">
            Pendaftaran Personal Trainer
          </h3>

          <div className="grid grid-cols-[1fr_2fr] gap-8 max-md:grid-cols-1">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Tanggal Transaksi
                </label>
                <input
                  type="text"
                  disabled
                  value={todayFormatted}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs font-mono rounded"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Nama Anggota <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={memberID}
                  onChange={(e) => setMemberID(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                >
                  <option value="">-Pilih-</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} (@{m.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Nama Pelatih <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={trainerID}
                  onChange={(e) => setTrainerID(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                >
                  <option value="">-Pilih-</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Paket Latihan Anggota <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body"
                >
                  <option value="">-Pilih-</option>
                  <option value="10 Sesi">10 Sesi (Rp 1.500.000)</option>
                  <option value="20 Sesi">20 Sesi (Rp 2.800.000)</option>
                  <option value="30 Sesi">30 Sesi (Rp 3.900.000)</option>
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
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Keterangan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masukkan Keterangan atau Detail Tambahan..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-body resize-none h-[225px]"
                />
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-accent font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer rounded shadow-sm"
                >
                  {loading ? 'MENYIMPAN...' : '✓ Simpan Transaksi'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
