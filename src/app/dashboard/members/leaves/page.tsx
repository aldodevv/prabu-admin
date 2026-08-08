'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { membersApi, memberLeavesApi } from '@/core/api';
import { Member, MemberLeave } from '@/core/types';
import { DataTable, Column } from '@/components/core/DataTable';
import {
  PauseCircle,
  Plus,
  Search,
  Printer,
  XCircle,
  Calendar,
  FileSpreadsheet,
  X,
  UserCheck,
  ArrowLeft,
  Save,
  CheckCircle2
} from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';
import { formatIDR } from '@/utils';
import { permissions } from '@/lib/permissions';
import { MemberLeaveReceiptTemplate } from '@/components/core/PrintTemplates';

export default function MemberLeavesPage() {
  const { activeBranchID, user } = useAuth();
  const canWrite = !permissions.isReadOnly(user?.role);
  const lastFetchedBranchRef = useRef<string | null>(null);

  // View mode state: 'list' | 'create'
  const [step, setStep] = useState<'list' | 'create'>('list');

  const [leaves, setLeaves] = useState<MemberLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Form State
  const [memberSearch, setMemberSearch] = useState('');
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchingMembers, setSearchingMembers] = useState(false);

  // Form Fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [feeAmount, setFeeAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Receipt Modal State
  const [printLeave, setPrintLeave] = useState<MemberLeave | null>(null);

  useEffect(() => {
    if (activeBranchID && (lastFetchedBranchRef.current !== activeBranchID || page > 1 || search)) {
      lastFetchedBranchRef.current = activeBranchID;
      fetchLeaves();
    }
  }, [activeBranchID, page, perPage, search]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await memberLeavesApi.list({
        branch_id: activeBranchID || undefined,
        search,
        page,
        per_page: perPage,
      });
      if (res.success && res.data) {
        setLeaves(res.data);
        setTotal(res.meta?.total || res.data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search Members Autocomplete
  useEffect(() => {
    if (!memberSearch.trim()) {
      setMemberOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingMembers(true);
      try {
        const res = await membersApi.list({
          branch_id: activeBranchID || undefined,
          search: memberSearch,
          per_page: 10,
        });
        if (res.success && res.data) {
          setMemberOptions(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingMembers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearch, activeBranchID]);

  // Calculate duration days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const durationDays = calculateDays();

  const handleOpenCreate = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setFeeAmount(100000);
    setPaymentMethod('cash');
    setNotes('Cuti Anggota');
    setFormError('');
    setStep('create');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setFormError('Silakan pilih Anggota terlebih dahulu');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Tanggal mulai dan akhir cuti wajib diisi');
      return;
    }
    if (durationDays <= 0) {
      setFormError('Tanggal akhir cuti harus setelah tanggal mulai');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await memberLeavesApi.create({
        member_id: selectedMember.id,
        branch_id: activeBranchID || selectedMember.branch_id,
        start_date: startDate,
        end_date: endDate,
        fee_amount: Number(feeAmount),
        payment_method: paymentMethod,
        notes: notes || 'Cuti Anggota',
      });

      if (res.success && res.data) {
        setStep('list');
        fetchLeaves();
        setPrintLeave(res.data);
      } else {
        setFormError(res.error || 'Gagal mengajukan cuti anggota');
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengajukan cuti anggota');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string, name?: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan cuti untuk ${name || 'anggota'}?`)) return;
    try {
      const res = await memberLeavesApi.cancel(id);
      if (res.success) {
        alert('Cuti anggota berhasil dibatalkan');
        fetchLeaves();
      } else {
        alert(res.error || 'Gagal membatalkan cuti');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan cuti');
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'No',
      'Nomor Anggota',
      'Nama Anggota',
      'Cabang',
      'Tanggal Mulai Cuti',
      'Tanggal Akhir Cuti',
      'Status',
      'Biaya Cuti',
      'Pembayaran',
      'Keterangan',
      'Petugas',
      'Tanggal Pengajuan',
    ];
    const data = leaves.map((l, index) => [
      (page - 1) * perPage + index + 1,
      l.member_code || '-',
      l.member_name || '-',
      l.branch_name || '-',
      l.start_date,
      l.end_date,
      l.status.toUpperCase(),
      l.fee_amount,
      l.payment_method.toUpperCase(),
      l.notes || '-',
      l.created_by_name || '-',
      new Date(l.created_at).toLocaleDateString('id-ID'),
    ]);
    exportToExcel({
      filename: 'Data_Cuti_Anggota_PrabuGym',
      title: 'Data Cuti & Freeze Masa Aktif Anggota Prabu Gym',
      headers,
      data,
    });
  };

  const columns: Column<MemberLeave>[] = [
    {
      key: 'member_code',
      header: 'Nomor Anggota',
      className: 'font-mono text-xs font-semibold text-slate-800',
      render: (l) => l.member_code || '-'
    },
    {
      key: 'member_name',
      header: 'Nama Anggota',
      className: 'font-bold text-slate-800',
      render: (l) => l.member_name || '-'
    },
    {
      key: 'branch_name',
      header: 'Cabang',
      className: 'text-xs text-slate-600',
      render: (l) => l.branch_name || '-'
    },
    {
      key: 'periode',
      header: 'Periode Cuti',
      render: (l) => (
        <span className="text-xs font-semibold text-slate-700">
          {l.start_date} s/d {l.end_date}
        </span>
      )
    },
    {
      key: 'durasi',
      header: 'Durasi',
      align: 'center',
      className: 'font-mono font-bold text-xs text-slate-700',
      render: (l) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${days} Hari`;
      }
    },
    {
      key: 'fee_amount',
      header: 'Biaya Cuti',
      align: 'right',
      className: 'font-mono font-bold text-slate-800',
      render: (l) => formatIDR(l.fee_amount)
    },
    {
      key: 'payment_method',
      header: 'Pembayaran',
      align: 'center',
      render: (l) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {l.payment_method}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (l) => {
        const isAktif = l.status === 'active';
        const isCancelled = l.status === 'cancelled';
        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${isAktif ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
            isCancelled ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
            {isAktif ? '● Aktif Cuti' : isCancelled ? 'Batal' : 'Selesai'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      className: 'w-24',
      render: (l) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPrintLeave(l)}
            title="Cetak Receipt Cuti"
            className="p-2 bg-[#007BFF] hover:bg-[#0069D9] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {canWrite && l.status === 'active' && (
            <button
              onClick={() => handleCancelLeave(l.id, l.member_name)}
              title="Batalkan Cuti"
              className="p-2 bg-[#DC3545] hover:bg-[#C82333] text-white rounded shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
            <span>Data Anggota</span>
            <span>&gt;</span>
            <span className="text-[#17A2B8]">Cuti Anggota</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-1">
            <PauseCircle className="w-5 h-5 text-[#17A2B8]" />
            Cuti & Freeze Masa Aktif Anggota
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {step === 'list' ? (
            <>
              {canWrite && (
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-all hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Pengajuan Cuti Anggota
                </button>
              )}

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep('list')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-all hover:scale-105 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Cuti
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: LISTING TABLE */}
      {step === 'list' && (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama, nomor anggota, atau catatan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#17A2B8]"
              />
            </div>
          </div>

          <DataTable
            title="Daftar Cuti Anggota"
            columns={columns}
            data={leaves}
            loading={loading}
            currentPage={page}
            totalItems={total}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={(val) => {
              setPerPage(val);
              setPage(1);
            }}
            loadingMessage="Loading data cuti anggota..."
            emptyMessage="Belum ada riwayat cuti anggota."
          />
        </div>
      )}

      {/* STEP 2: DEDICATED FORM PAGE */}
      {step === 'create' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-fadeIn">
          <div className="bg-brand-cyan px-6 py-4 text-white font-bold flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">Form Pengajuan Cuti Anggota Baru</span>
            </div>
            <button
              onClick={() => setStep('list')}
              className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 text-xs text-slate-700 max-w-4xl mx-auto">
            {formError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded">
                ⚠️ {formError}
              </div>
            )}

            {/* Section 1: Member Autocomplete Select */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 text-sm block">1. Pilih Anggota Yang Mengajukan Cuti *</label>
              {!selectedMember ? (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Ketik Nama atau Nomor Anggota..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8] text-xs"
                    />
                  </div>
                  {searchingMembers && (
                    <div className="text-[11px] text-slate-400 mt-1 font-accent">Mencari anggota...</div>
                  )}
                  {memberOptions.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {memberOptions.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m);
                            setMemberOptions([]);
                          }}
                          className="p-3 hover:bg-cyan-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{m.full_name}</div>
                            <div className="text-xs text-slate-500 font-mono">No. Anggota: {m.username} | Expired: {m.membership_end}</div>
                          </div>
                          <UserCheck className="w-5 h-5 text-[#17A2B8]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#eef9fb] border border-[#bce8f1] rounded-lg flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>{selectedMember.full_name}</span>
                      <span className="px-2 py-0.5 bg-brand-cyan text-white text-[10px] uppercase font-bold rounded">Member</span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      No. Anggota: <span className="font-bold text-slate-900">{selectedMember.username}</span> |
                      Paket: <span className="font-bold text-slate-900">{selectedMember.membership_type}</span> |
                      Masa Aktif s/d: <span className="font-bold text-cyan-700">{selectedMember.membership_end}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberSearch('');
                    }}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded text-xs transition-colors cursor-pointer"
                  >
                    Ganti Anggota
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Date Range */}
            <div className="space-y-3 pt-2">
              <label className="font-bold text-slate-800 text-sm block">2. Tentukan Periode Tanggal Cuti *</label>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Tanggal Mulai Cuti *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800 focus:outline-none focus:border-brand-cyan"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Tanggal Akhir Cuti *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-semibold text-slate-800 focus:outline-none focus:border-brand-cyan"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Duration & Freeze Impact Preview Box */}
            {startDate && endDate && durationDays > 0 && (
              <div className="p-4 bg-[#eef9fb] border border-[#bce8f1] rounded-lg text-slate-800 space-y-2 font-sans shadow-xs">
                <div className="font-bold flex items-center gap-2 text-[#138496] text-sm">
                  <Calendar className="w-5 h-5 text-[#17A2B8]" />
                  <span>Durasi Cuti Ditetapkan: {durationDays} Hari ({startDate} s/d {endDate})</span>
                </div>
                <div className="text-xs text-slate-700 space-y-1 pl-7">
                  <div>
                    • Status Membership: <span className="font-bold text-[#17A2B8]">BEKU / CUTI</span> mulai <strong>{startDate}</strong> s/d <strong>{endDate}</strong>.
                  </div>
                  <div>
                    • Kelanjutan Membership: Setelah tanggal cuti berakhir (mulai <strong>{(() => {
                      const d = new Date(endDate);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().split('T')[0];
                    })()}</strong>), sisa hari membership kembali berjalan normal.
                  </div>
                  {selectedMember?.membership_end && (
                    <div>
                      • Perkiraan Tanggal Kadaluarsa Baru: <span className="font-bold text-emerald-700">{(() => {
                        const d = new Date(selectedMember.membership_end);
                        d.setDate(d.getDate() + durationDays);
                        return d.toISOString().split('T')[0];
                      })()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Payment Details */}
            <div className="space-y-3 pt-2">
              <label className="font-bold text-slate-800 text-sm block">3. Pembayaran Biaya Cuti *</label>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Metode Pembayaran *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold text-slate-800 focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Biaya Cuti (Rp) *</label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    placeholder="100000"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold font-mono text-slate-800 focus:outline-none focus:border-brand-cyan"
                    required
                  />
                  <div className="text-[10px] text-slate-400">Default Rp 100.000 (dapat disesuaikan)</div>
                </div>
              </div>
            </div>

            {/* Section 4: Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-800 text-sm block">4. Keterangan / Alasan Cuti</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan cuti anggota (misal: Sakit, Dinas luar kota)..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 p-3 rounded text-xs text-slate-800 focus:outline-none focus:border-brand-cyan"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('list')}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white font-bold uppercase tracking-wider rounded cursor-pointer transition-all hover:scale-105 disabled:opacity-50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Memproses...' : 'Simpan & Freeze Cuti'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printLeave && (
        <MemberLeaveReceiptTemplate
          onClose={() => setPrintLeave(null)}
          data={{
            transactionDate: printLeave.created_at,
            memberCode: printLeave.member_code || '-',
            memberName: printLeave.member_name || '-',
            branchName: printLeave.branch_name,
            startDate: printLeave.start_date,
            endDate: printLeave.end_date,
            status: printLeave.status,
            paymentMethod: printLeave.payment_method,
            feeAmount: printLeave.fee_amount,
            notes: printLeave.notes,
            cashierName: printLeave.created_by_name || user?.full_name || 'Admin',
          }}
        />
      )}
    </div>
  );
}
