'use client';

import { useState, useEffect } from 'react';
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
  CreditCard, 
  FileSpreadsheet,
  X,
  UserCheck
} from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';
import { formatIDR, formatDateLong } from '@/utils';
import { permissions } from '@/lib/permissions';

export default function MemberLeavesPage() {
  const { activeBranchID, user } = useAuth();
  const canWrite = !permissions.isReadOnly(user?.role);

  const [leaves, setLeaves] = useState<MemberLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    fetchLeaves();
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
    
    // Default 10 days leave
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 9);
    setEndDate(defaultEnd.toISOString().split('T')[0]);
    
    setFeeAmount(100000);
    setPaymentMethod('cash');
    setNotes('Cuti Anggota');
    setFormError('');
    setIsModalOpen(true);
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
        setIsModalOpen(false);
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
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            isAktif ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
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
          {canWrite && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-all hover:scale-105 cursor-pointer"
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
        </div>
      </div>

      {/* Main Table Container */}
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

      {/* Modal Form Pengajuan Cuti */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
            <div className="bg-[#17A2B8] px-5 py-3.5 text-white font-bold flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider">Form Pengajuan Cuti Anggota</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold">
                  ⚠️ {formError}
                </div>
              )}

              {/* Step 1: Member Autocomplete Select */}
              <div className="space-y-1.5 relative">
                <label className="font-bold text-slate-800 block">Pilih Anggota *</label>
                {!selectedMember ? (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Ketik Nama atau Nomor Anggota..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]"
                      />
                    </div>
                    {searchingMembers && (
                      <div className="text-[11px] text-slate-400 mt-1 font-accent">Mencari anggota...</div>
                    )}
                    {memberOptions.length > 0 && (
                      <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {memberOptions.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMember(m);
                              setMemberOptions([]);
                            }}
                            className="p-2.5 hover:bg-cyan-50 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{m.full_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">No: {m.username} | Exp: {m.membership_end}</div>
                            </div>
                            <UserCheck className="w-4 h-4 text-cyan-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedMember.full_name}</div>
                      <div className="text-xs text-slate-600 font-mono">
                        No. Anggota: <span className="font-bold">{selectedMember.username}</span> | 
                        Masa Aktif s/d: <span className="font-bold text-cyan-700">{selectedMember.membership_end}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearch('');
                      }}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Date Range */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Tanggal Mulai Cuti *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Tanggal Akhir Cuti *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Duration & Freeze Impact Preview */}
              {durationDays > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Durasi Cuti: {durationDays} Hari</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    * Masa aktif membership anggota akan otomatis di-freeze & diperpanjang sebanyak <strong>{durationDays} Hari</strong> setelah tanggal akhir cuti.
                  </div>
                </div>
              )}

              {/* Step 3: Payment Details */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Metode Pembayaran *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold text-slate-800"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Biaya Cuti (Rp) *</label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    placeholder="100000"
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded font-bold font-mono text-slate-800"
                    required
                  />
                  <div className="text-[10px] text-slate-400">Default Rp 100.000 (dapat disesuaikan)</div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Keterangan / Alasan Cuti</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan cuti anggota (misal: Sakit, Dinas luar kota)..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded text-xs text-slate-800"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#17A2B8] hover:bg-[#138496] text-white font-bold uppercase tracking-wider rounded cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Simpan & Freeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden font-mono text-xs">
            <div className="bg-[#007BFF] px-5 py-3 text-white font-bold flex justify-between items-center select-none no-print">
              <span className="text-sm uppercase tracking-wider">Kwitansi Cuti Anggota</span>
              <button onClick={() => setPrintLeave(null)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-slate-800 bg-white" id="printable-receipt">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <div className="font-extrabold text-base tracking-widest text-slate-900">PRABU GYM</div>
                <div className="text-[11px] text-slate-500 font-sans">{printLeave.branch_name || 'Fitness & Health Center'}</div>
                <div className="text-[10px] text-slate-400 font-sans">BUKTI PEMBAYARAN CUTI ANGGOTA</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{new Date(printLeave.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Anggota:</span>
                  <span className="font-bold">{printLeave.member_code || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Anggota:</span>
                  <span className="font-bold">{printLeave.member_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Cuti:</span>
                  <span className="font-bold text-cyan-700">{printLeave.start_date} s/d {printLeave.end_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="uppercase font-bold">{printLeave.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="uppercase font-bold">{printLeave.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas:</span>
                  <span>{printLeave.created_by_name || 'Admin'}</span>
                </div>
              </div>

              <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-sm font-extrabold text-slate-900">
                  <span>TOTAL BIAYA CUTI</span>
                  <span>{formatIDR(printLeave.fee_amount)}</span>
                </div>
              </div>

              {printLeave.notes && (
                <div className="text-[10px] text-slate-500 italic">
                  * Keterangan: {printLeave.notes}
                </div>
              )}

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                Terima kasih atas kepercayaannya.<br />Selamat beristirahat dan sampai jumpa kembali!
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 no-print">
              <button
                onClick={() => setPrintLeave(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#007BFF] hover:bg-[#0069D9] text-white font-bold rounded text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
