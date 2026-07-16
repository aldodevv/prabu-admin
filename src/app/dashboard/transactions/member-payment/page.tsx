'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Member {
  id: string;
  full_name: string;
  username: string;
}

export default function MemberPaymentPage() {
  const { activeBranchID } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
    }
  }, [activeBranchID]);

  const fetchMembers = async () => {
    try {
      const res = await api.get<any>(`/admin/members?branch_id=${activeBranchID}&per_page=100`);
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount) return;
    setLoading(true);
    setMessage('');

    const memberObj = members.find((m) => m.id === selectedMember);
    const fullName = memberObj ? memberObj.full_name : 'Anggota';
    const txNotes = `Pembayaran Anggota: ${fullName} - Metode: ${paymentMethod}. Catatan: ${notes}`;

    const txBody = {
      member_id: selectedMember,
      notes: txNotes.trim(),
      total_amount: Number(amount),
      items: [],
    };

    try {
      const res = await api.post('/admin/transactions', txBody);
      if (res.success) {
        setMessage('Pembayaran iuran membership berhasil dicatat!');
        setSelectedMember('');
        setAmount('');
        setNotes('');
      } else {
        setMessage('Error: ' + (res.error || 'Gagal menyimpan transaksi'));
      }
    } catch (err: any) {
      console.error(err);
      setMessage('Error: ' + (err.message || 'Terjadi kesalahan jaringan'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-2xl">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">PEMBAYARAN ANGGOTA</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Pencatatan manual pembayaran iuran bulanan / tahunan anggota
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          ✓ {message}
        </div>
      )}

      <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-2">
              Pilih Anggota / Member *
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2.5 text-xs transition-all rounded font-bold uppercase"
              required
            >
              <option value="">-- PILIH ANGGOTA --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} (@{m.username})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-2">
                Jumlah Pembayaran (IDR) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 150000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2.5 text-xs transition-all rounded"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-2">
                Metode Pembayaran *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2.5 text-xs transition-all rounded"
              >
                <option value="Tunai">Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-2">
              Keterangan Pembayaran
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembayaran membership paket gym 1 bulan s.d September 2026..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI PEMBAYARAN'}
          </button>
        </form>
      </div>
    </div>
  );
}
