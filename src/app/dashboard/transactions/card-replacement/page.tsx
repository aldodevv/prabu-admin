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
  const [cardPrice, setCardPrice] = useState('0');
  const [reason, setReason] = useState('Mutasi Anggota');
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
      // Fetch members from ALL clubs
      const res = await membersApi.list({
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
      const res = await transactionsApi.list({
        branch_id: activeBranchID || undefined,
        per_page: 200
      });
      if (res.success && res.data) {
        const list: CardReplacementLog[] = [];
        res.data.forEach((tx: any) => {
          if (tx.notes && (tx.notes.startsWith('Pergantian Kartu:') || tx.notes.startsWith('Pergantian Cabang:'))) {
            const isCabang = tx.notes.startsWith('Pergantian Cabang:');
            let oldUser = '-';
            let newUser = '-';
            let reasonText = isCabang ? 'Mutasi Anggota' : 'Kartu Hilang';

            const oldMatch = tx.notes.match(/Lama:\s*([^|]+)/);
            const newMatch = tx.notes.match(/Baru:\s*([^|]+)/);
            const reasonMatch = tx.notes.match(/Alasan:\s*(.+)$/);

            if (oldMatch) oldUser = oldMatch[1].trim();
            if (newMatch) newUser = newMatch[1].trim();
            if (reasonMatch) reasonText = reasonMatch[1].trim();

            list.push({
              id: tx.id,
              transaction_number: tx.transaction_number || `PRABU-CC-${tx.id.substring(0,6).toUpperCase()}`,
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
    setCardPrice('0');
    setReason('Mutasi Anggota');
    setFormError('');
    setFormSuccess('');
    setStep('add');
  };

  const handleSelectMember = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setNewUsername('');
    setFormError('');
    if (!memberId) return;

    const mObj = members.find(m => m.id === memberId);
    if (!mObj) return;

    if (mObj.branch_id === activeBranchID) {
      setFormError('Anggota tersebut sudah terdaftar di cabang ini!');
      return;
    }

    if (!activeBranchID) {
      setFormError('ID cabang aktif tidak ditemukan');
      return;
    }

    try {
      const nextCodeRes = await membersApi.getNextCode(activeBranchID);
      if (nextCodeRes.success && nextCodeRes.data) {
        setNewUsername(nextCodeRes.data.next_code);
      } else {
        setFormError('Gagal mengambil nomor anggota baru untuk cabang terpilih');
      }
    } catch (err) {
      console.error(err);
      setFormError('Gagal menghubungkan ke server untuk mendapatkan nomor anggota baru');
    }
  };

  const handleSaveReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !newUsername) {
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

    if (member.branch_id === activeBranchID) {
      setFormError('Anggota tersebut sudah terdaftar di cabang ini!');
      setSubmitting(false);
      return;
    }

    // Step 1: Create transaction record mapping
    const txNotes = `Pergantian Cabang: Lama: ${member.username} | Baru: ${newUsername} | Alasan: ${reason}`;
    const txBody = {
      member_id: member.id,
      notes: txNotes,
      total_amount: 0, // Tanpa biaya apapun
      items: [],
    };

    try {
      const txRes = await transactionsApi.create(txBody);
      if (!txRes.success) {
        setFormError(txRes.error || 'Gagal menyimpan transaksi pergantian cabang.');
        setSubmitting(false);
        return;
      }

      // Step 2: Update member username & branch to the new branch in the database
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
        branch_id: activeBranchID || undefined, // Update to new branch!
      };

      const memberRes = await membersApi.update(member.id, memberUpdateBody);
      if (memberRes.success) {
        setFormSuccess(`Sukses! Anggota berhasil dipindahkan ke cabang ini dengan nomor anggota baru: ${newUsername}`);
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
      header: 'No. Anggota Lama',
      className: 'font-mono text-red-650',
      render: (log) => log.old_username
    },
    {
      key: 'new_username',
      header: 'No. Anggota Baru',
      className: 'font-mono text-emerald-800',
      render: (log) => log.new_username
    },
    {
      key: 'reason',
      header: 'Alasan',
      className: 'text-slate-600 font-normal leading-relaxed'
    },
    {
      key: 'fee',
      header: 'Biaya',
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
              title="Pergantian Cabang / Mutasi"
              description="Mutasi Anggota antar Cabang Prabu Gym"
              action={
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pindah Cabang</span>
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
              title="Log Pergantian Cabang"
              columns={columns}
              data={filteredLogs}
              loading={loading}
              loadingMessage="Loading logs..."
              emptyMessage="Belum ada riwayat pergantian cabang."
            />
          </div>
        )}

        {/* Step 2: Add New Form */}
        {step === 'add' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <PageHeader
              title="Form Pergantian Cabang"
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
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="">- Pilih Anggota -</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.username}) - {m.branch_name || 'Cabang Lain'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kartu Baru */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nomor Anggota Baru</label>
                  <input
                    type="text"
                    required
                    readOnly
                    disabled
                    value={newUsername}
                    placeholder="Auto-generate setelah memilih anggota..."
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono cursor-not-allowed"
                  />
                </div>

                {/* Alasan */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Alasan Pindah Cabang</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  >
                    <option value="Mutasi Anggota">Mutasi Anggota</option>
                    <option value="Pindah Domisili">Pindah Domisili</option>
                    <option value="Kebijakan Manajemen">Kebijakan Manajemen</option>
                  </select>
                </div>

                {/* Biaya Cetak */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Biaya Mutasi</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Rp. 0 (Gratis)"
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-150 pt-6">
                  <button
                    type="submit"
                    disabled={submitting || formError !== '' || !newUsername}
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
            packageName: `Pergantian Cabang (${printLog.reason})`,
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
