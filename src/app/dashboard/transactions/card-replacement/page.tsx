'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Member {
  id: string;
  full_name: string;
  username: string;
}

interface ReplacementLog {
  id: string;
  member_name: string;
  reason: string;
  replacement_fee: number;
  replaced_at: string;
  admin_name: string;
}

export default function CardReplacementPage() {
  const { activeBranchID, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<ReplacementLog[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [reason, setReason] = useState('Kartu Hilang');
  const [fee, setFee] = useState('25000');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (activeBranchID) {
      fetchLogs();
      fetchMembers();
    }
  }, [activeBranchID]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Mock loading card replacement logs
      setTimeout(() => {
        setLogs([
          {
            id: 'l1',
            member_name: 'Fathan Ramadhan',
            reason: 'Kartu Patah',
            replacement_fee: 25000,
            replaced_at: '2026-07-15 10:20',
            admin_name: 'Admin Grogol'
          },
          {
            id: 'l2',
            member_name: 'Rudi Wijaya',
            reason: 'Kartu Hilang',
            replacement_fee: 25000,
            replaced_at: '2026-07-12 15:40',
            admin_name: 'Admin Grogol'
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !reason || !fee) return;
    setSubmitting(true);

    const memberObj = members.find(m => m.id === selectedMember);
    const newLog: ReplacementLog = {
      id: `l-${Date.now()}`,
      member_name: memberObj?.full_name || 'Member',
      reason: reason,
      replacement_fee: parseInt(fee),
      replaced_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5),
      admin_name: user?.full_name || 'Admin'
    };

    setTimeout(() => {
      setLogs([newLog, ...logs]);
      setIsFormOpen(false);
      setSelectedMember('');
      setReason('Kartu Hilang');
      setFee('25000');
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading text-slate-800">PERGANTIAN KARTU FISIK</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
            Pencatatan & administrasi cetak ulang kartu anggota rusak / hilang
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center font-accent font-semibold text-xs uppercase tracking-widest px-6 py-3.5 bg-[#DC3545] hover:bg-[#c82333] text-white rounded shadow-sm cursor-pointer"
        >
          + CATAT PERGANTIAN KARTU
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading log pergantian kartu...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Daftar Penggantian Kartu</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Anggota</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Alasan</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-right">Biaya Admin</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Waktu Cetak</th>
                    <th className="py-3 px-4">Operator Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{l.member_name}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-700">{l.reason}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-right text-slate-800">Rp {l.replacement_fee.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4 border-r border-slate-100 font-mono text-slate-550">{l.replaced_at}</td>
                      <td className="py-3.5 px-4 text-slate-600">{l.admin_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-heading text-xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
              CATAT PERGANTIAN KARTU
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Anggota / Member *
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded font-semibold uppercase"
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

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Alasan Pergantian *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                >
                  <option value="Kartu Hilang">Kartu Hilang</option>
                  <option value="Kartu Patah / Rusak">Kartu Patah / Rusak</option>
                  <option value="Perubahan Profil / Foto">Perubahan Profil / Foto</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-xs uppercase tracking-widest font-accent mb-1.5">
                  Biaya Cetak Ulang (IDR) *
                </label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#DC3545] focus:outline-none text-slate-700 px-3 py-2 text-xs transition-all rounded"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'MEMPROSES...' : 'DAFTARKAN CETAK ULANG KARTU'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
