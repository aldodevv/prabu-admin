'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Plus, Printer, ArrowLeft, Save, Search, FileText, CreditCard } from 'lucide-react';

interface Member {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type: string;
  membership_start: string;
  membership_end: string;
  is_active: boolean;
  branch_id: string;
}

interface CardReplacementLog {
  id: string;
  transaction_number: string;
  date: string;
  member_id: string;
  member_name: string;
  old_username: string;
  new_username: string;
  reason: string;
  fee: number;
  admin_name: string;
}

export default function CardReplacementPage() {
  const { activeBranchID, user } = useAuth();
  
  // Navigation steps: 'list' | 'add'
  const [step, setStep] = useState<'list' | 'add'>('list');
  const [printLog, setPrintLog] = useState<CardReplacementLog | null>(null);

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<CardReplacementLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [cardPrice, setCardPrice] = useState('25000');
  const [reason, setReason] = useState('Kartu Hilang');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchMembers();
      fetchLogs();
    }
  }, [activeBranchID]);

  const fetchMembers = async () => {
    try {
      const res = await api.get<any>(`/admin/members?branch_id=${activeBranchID}&per_page=200`);
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/admin/transactions?branch_id=${activeBranchID}&per_page=200`);
      if (res.success && res.data) {
        // Parse logs from transactions starting with "Pergantian Kartu:"
        const list: CardReplacementLog[] = [];
        res.data.forEach((tx: any) => {
          if (tx.notes && tx.notes.startsWith('Pergantian Kartu:')) {
            // Notes format: "Pergantian Kartu: Lama: {old} | Baru: {new} | Alasan: {reason}"
            let oldUser = '-';
            let newUser = '-';
            let reasonText = 'Kartu Hilang';

            const oldMatch = tx.notes.match(/Lama:\s*([^|]+)/);
            const newMatch = tx.notes.match(/Baru:\s*([^|]+)/);
            const reasonMatch = tx.notes.match(/Alasan:\s*(.+)$/);

            if (oldMatch) oldUser = oldMatch[1].trim();
            if (newMatch) newUser = newMatch[1].trim();
            if (reasonMatch) reasonText = reasonMatch[1].trim();

            list.push({
              id: tx.id,
              transaction_number: tx.transaction_number || `PRABU-CR-${tx.id.substring(0,6).toUpperCase()}`,
              date: tx.transaction_date.substring(0, 10),
              member_id: tx.member_id || '',
              member_name: tx.member_name || 'Member',
              old_username: oldUser,
              new_username: newUser,
              reason: reasonText,
              fee: tx.total_amount,
              admin_name: tx.admin_name || 'Admin',
            });
          }
        });
        setLogs(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedMemberId('');
    setNewUsername('');
    setCardPrice('25000');
    setReason('Kartu Hilang');
    setFormError('');
    setFormSuccess('');
    setStep('add');
  };

  const handleSaveReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !newUsername || !cardPrice) {
      setFormError('Semua field wajib diisi!');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) {
      setFormError('Anggota tidak ditemukan');
      setSubmitting(false);
      return;
    }

    // Step 1: Create transaction record mapping
    const txNotes = `Pergantian Kartu: Lama: ${member.username} | Baru: ${newUsername} | Alasan: ${reason}`;
    const txBody = {
      member_id: member.id,
      notes: txNotes,
      total_amount: Number(cardPrice),
      items: [],
    };

    try {
      const txRes = await api.post<any>('/admin/transactions', txBody);
      if (!txRes.success) {
        setFormError(txRes.error || 'Gagal menyimpan transaksi pergantian kartu.');
        setSubmitting(false);
        return;
      }

      // Step 2: Update member username to the new username in the database
      const memberUpdateBody = {
        full_name: member.full_name,
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        date_of_birth: member.date_of_birth || '',
        gender: member.gender || 'Laki-laki',
        membership_type: member.membership_type,
        membership_start: member.membership_start,
        membership_end: member.membership_end,
        is_active: member.is_active,
        username: newUsername, // Save the new QR username
      };

      const memberRes = await api.put<any>(`/admin/members/${member.id}`, memberUpdateBody);
      if (memberRes.success) {
        setFormSuccess(`Sukses! Kartu berhasil diganti & barcode baru telah dikirimkan ke email: ${member.email || 'user@prabugym.com'}`);
        fetchMembers();
        fetchLogs();
        setTimeout(() => {
          setStep('list');
        }, 1500);
      } else {
        setFormError(memberRes.error || 'Gagal memperbarui barcode / nomor anggota baru.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      return (
        log.member_name.toLowerCase().includes(q) ||
        log.old_username.toLowerCase().includes(q) ||
        log.new_username.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q)
      );
    });
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
          body, .min-h-screen, main, #print-replacement-receipt {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-replacement-receipt {
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

      {/* Main screens wrapper */}
      <div className="no-print space-y-6">
        
        {/* Step 1: List View */}
        {step === 'list' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-heading text-slate-800">PERGANTIAN KARTU FISIK / QR</h2>
                <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
                  Administrasi & Cetak Ulang Kartu Anggota Hilang atau Rusak
                </p>
              </div>
              
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kartu</span>
              </button>
            </div>

            {/* Pencarian Box */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider">Pencarian</span>
              </div>
              <div className="p-6">
                <div className="flex gap-4 flex-wrap items-center">
                  <input
                    type="text"
                    placeholder="Cari nama anggota, nomor lama, atau nomor baru..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded min-w-[320px]"
                  />
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reset Pencarian</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            {loading ? (
              <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
                Loading log pergantian kartu...
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
                  <span className="text-sm uppercase tracking-wider font-heading">Daftar Penggantian Kartu</span>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-650 border border-slate-200">
                      <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                        <tr>
                          <th className="py-3 px-4 border-r border-slate-350/40 w-12 text-center">No</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Tanggal</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nomor Anggota Lama</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nomor Anggota Baru</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nama Anggota</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Alasan</th>
                          <th className="py-3 px-4 border-r border-slate-350/40 text-center">Biaya Kartu</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-xs">
                        {getFilteredLogs().length > 0 ? (
                          getFilteredLogs().map((log, idx) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 border-r border-slate-100 text-center">{idx + 1}</td>
                              <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-600">
                                {formatDateLabel(log.date)}
                              </td>
                              <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-800">@{log.old_username}</td>
                              <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-900 font-bold">@{log.new_username}</td>
                              <td className="py-4 px-4 border-r border-slate-100 text-slate-800 font-bold">{log.member_name}</td>
                              <td className="py-4 px-4 border-r border-slate-100 text-slate-700">{log.reason}</td>
                              <td className="py-4 px-4 border-r border-slate-100 text-center font-bold text-slate-900">
                                Rp {log.fee.toLocaleString('id-ID')}
                              </td>
                              <td className="py-4 px-4 text-center select-none">
                                <button
                                  onClick={() => {
                                    setPrintLog(log);
                                    setTimeout(() => {
                                      window.print();
                                    }, 100);
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-350 text-slate-800 font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-xs"
                                >
                                  <Printer className="w-3 h-3" />
                                  Cetak
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold select-none uppercase">
                              Belum ada riwayat pergantian kartu.
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

        {/* Step 2: Form View (Tambah Kartu - Image 1 Layout) */}
        {step === 'add' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {/* Breadcrumb path label matching screen */}
            <div className="text-xs font-accent text-slate-450 uppercase tracking-widest select-none">
              Transaksi Fitnes &gt; Pergantian Kartu &gt; Tambah Kartu
            </div>

            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider font-heading">Tambah Kartu</span>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                ⚠️ {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                ✓ {formSuccess}
              </div>
            )}

            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm">
              <form onSubmit={handleSaveReplacement} className="space-y-6 text-sm text-slate-700">
                
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

                {/* Nama Anggota */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota *</label>
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold uppercase"
                  >
                    <option value="">-Pilih-</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.username} | {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nomor Anggota Baru */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor Anggota Baru *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Masukan Nomor Anggota Baru"
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono font-bold"
                  />
                </div>

                {/* Harga Kartu */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Harga Kartu *</label>
                  <input
                    type="number"
                    required
                    value={cardPrice}
                    onChange={(e) => setCardPrice(e.target.value)}
                    placeholder="Masukan Harga Kartu"
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold"
                  />
                </div>

                {/* Alasan (Optional dropdown/text) */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Alasan *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="Kartu Hilang">Kartu Hilang</option>
                    <option value="Kartu Rusak / Patah">Kartu Rusak / Patah</option>
                    <option value="Perubahan Profil / Foto">Perubahan Profil / Foto</option>
                  </select>
                </div>

                {/* Form Buttons */}
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

      {/* Replaced Card Receipt View Overlay (Image 2 Layout) */}
      {printLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 p-8 rounded shadow-2xl relative text-black">
            <button
              onClick={() => setPrintLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* Receipt Area */}
            <div id="print-replacement-receipt" className="space-y-6">
              
              {/* Header Grid */}
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
                    PRABU CARD CHANGE
                  </h2>
                </div>
              </div>

              {/* Table details (Image 2 style) */}
              <div className="border border-black overflow-hidden rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[10px] text-slate-700">
                      <th className="py-2.5 px-3 border-r border-black">Tanggal Transaksi</th>
                      <th className="py-2.5 px-3 border-r border-black">Nama Anggota</th>
                      <th className="py-2.5 px-3 border-r border-black">Nomor Lama</th>
                      <th className="py-2.5 px-3 border-r border-black">Nomor Baru</th>
                      <th className="py-2.5 px-3">Harga Kartu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-semibold text-slate-850">
                      <td className="py-3 px-3 border-r border-black font-mono">{formatDateLabel(printLog.date)}</td>
                      <td className="py-3 px-3 border-r border-black font-bold">{printLog.member_name}</td>
                      <td className="py-3 px-3 border-r border-black font-mono">@{printLog.old_username}</td>
                      <td className="py-3 px-3 border-r border-black font-mono font-bold">@{printLog.new_username}</td>
                      <td className="py-3 px-3 font-bold">Rp {printLog.fee.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 border border-black text-center text-xs font-bold divide-x divide-black">
                <div>
                  <div className="py-2 border-b border-black uppercase bg-slate-50 text-[10px]">Member</div>
                  <div className="h-24" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{printLog.member_name}</div>
                </div>
                <div>
                  <div className="py-2 border-b border-black uppercase bg-slate-50 text-[10px]">Customer Service</div>
                  <div className="h-24" />
                  <div className="py-2 border-t border-black uppercase font-extrabold">{printLog.admin_name}</div>
                </div>
              </div>

            </div>

            {/* Print action buttons */}
            <div className="mt-6 flex justify-end gap-4 no-print select-none">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setPrintLog(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
