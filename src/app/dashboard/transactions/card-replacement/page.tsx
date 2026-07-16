'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { membersApi, transactionsApi } from '@/core/api';
import { formatDateLabel, formatIDR } from '@/core/constants';
import { Member, CardReplacementLog } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { OfficialReceiptTemplate } from '@/components/core/PrintTemplates';
import { Plus, Printer, ArrowLeft, Save, FileText, CreditCard } from 'lucide-react';

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
      const res = await membersApi.list({
        branch_id: activeBranchID || undefined,
        per_page: 200
      });
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
      // DB-level optimized query filtering by notes prefix
      const res = await transactionsApi.list({
        branch_id: activeBranchID || undefined,
        notes: 'Pergantian Kartu:',
        per_page: 200
      });
      if (res.success && res.data) {
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
      const txRes = await transactionsApi.create(txBody);
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

      const memberRes = await membersApi.update(member.id, memberUpdateBody);
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

  const handleResetSearch = () => {
    setSearchQuery('');
  };

  // Columns definition for DataTable
  const columns: Column<CardReplacementLog>[] = [
    {
      key: 'no',
      header: 'No',
      align: 'center',
      className: 'w-12',
      render: (_, idx) => idx + 1
    },
    {
      key: 'date',
      header: 'Tanggal',
      className: 'font-mono text-slate-500',
      render: (log) => formatDateLabel(log.date)
    },
    {
      key: 'member_name',
      header: 'Nama Anggota',
      className: 'font-bold text-slate-800'
    },
    {
      key: 'old_username',
      header: 'Kartu Lama',
      className: 'font-mono text-red-650',
      render: (log) => `@${log.old_username}`
    },
    {
      key: 'new_username',
      header: 'Kartu Baru',
      className: 'font-mono text-emerald-800',
      render: (log) => `@${log.new_username}`
    },
    {
      key: 'reason',
      header: 'Alasan',
      className: 'text-slate-600 font-normal leading-relaxed'
    },
    {
      key: 'fee',
      header: 'Biaya Cetak',
      align: 'right',
      className: 'font-extrabold text-slate-800',
      render: (log) => formatIDR(log.fee)
    },
    {
      key: 'admin_name',
      header: 'Nama CS',
      className: 'text-slate-500'
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      className: 'w-24',
      render: (log) => (
        <button
          onClick={() => setPrintLog(log)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-[9px] font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Receipt</span>
        </button>
      )
    }
  ];

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-8 font-sans">
      <div className="no-print space-y-6">
        
        {/* Step 1: List View */}
        {step === 'list' && (
          <div className="space-y-6 animate-fadeIn">
            <PageHeader
              title="Pergantian Kartu Fisik / QR"
              description="Administrasi & Cetak Ulang Kartu Anggota Hilang atau Rusak"
              action={
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kartu</span>
                </button>
              }
            />

            {/* Pencarian Box */}
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari nama anggota, nomor lama, atau nomor baru..."
              onReset={handleResetSearch}
            />

            {/* Logs Table */}
            <DataTable
              title="Log Pergantian Kartu"
              columns={columns}
              data={filteredLogs}
              loading={loading}
              loadingMessage="Loading logs..."
              emptyMessage="Belum ada riwayat pergantian kartu."
            />
          </div>
        )}

        {/* Step 2: Add New Form */}
        {step === 'add' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <PageHeader
              title="Form Pergantian Kartu"
              action={
                <button
                  onClick={() => setStep('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Batal</span>
                </button>
              }
            />

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
                
                {/* Cari Member */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota</label>
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      // Auto-suggest new username based on member name + random/time seed
                      const mObj = members.find(m => m.id === e.target.value);
                      if (mObj) {
                        const randomSeed = Math.floor(100 + Math.random() * 900);
                        const sanitizedName = mObj.full_name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
                        setNewUsername(`${sanitizedName}${randomSeed}`);
                      } else {
                        setNewUsername('');
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="">- Pilih Anggota -</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} (@{m.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kartu Baru */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Barcode / QR Baru</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="Masukkan Barcode / Nomor Anggota Baru..."
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  />
                </div>

                {/* Alasan */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Alasan Pergantian</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="Kartu Hilang">Kartu Hilang</option>
                    <option value="Kartu Rusak / Patah">Kartu Rusak / Patah</option>
                    <option value="Perubahan Username / QR">Perubahan Username / QR</option>
                  </select>
                </div>

                {/* Biaya Cetak */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Biaya Cetak Kartu</label>
                  <select
                    value={cardPrice}
                    onChange={(e) => setCardPrice(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  >
                    <option value="25000">Rp. 25.000</option>
                    <option value="50000">Rp. 50.000</option>
                    <option value="0">Gratis (Promo / Kebijakan)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-150 pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Print Receipt Overlay */}
      {printLog && (
        <OfficialReceiptTemplate
          onClose={() => setPrintLog(null)}
          data={{
            transactionNumber: printLog.transaction_number,
            transactionDate: printLog.date,
            memberUsername: printLog.new_username,
            memberName: printLog.member_name,
            packageName: `Pergantian Kartu (${printLog.reason})`,
            membershipStart: printLog.date,
            membershipEnd: printLog.date,
            paymentMethod: 'Tunai',
            price: printLog.fee,
            cashierName: printLog.admin_name
          }}
        />
      )}
    </div>
  );
}
