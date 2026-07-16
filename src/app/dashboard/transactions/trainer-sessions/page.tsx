'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ptRegistrationsApi, trainersApi } from '@/core/api';
import { 
  formatDateLabel, 
  formatIDR, 
  calculateExpiryDate, 
  getSessionCountFromPackage, 
  getSessionCountFromPackage as parseNotesCount 
} from '@/core/constants';
import { PTRegistration, Trainer } from '@/core/types';
import { PageHeader } from '@/components/core/PageHeader';
import { SearchFilterBar } from '@/components/core/SearchFilterBar';
import { DataTable, Column } from '@/components/core/DataTable';
import { SessionReceiptTemplate } from '@/components/core/PrintTemplates';
import { Search, Edit, Printer, List, ArrowLeft, Plus, Minus, Save, FileText } from 'lucide-react';

interface SessionLog {
  date: string;
  time: string;
  trainer_name: string;
  used_sessions: number;
  admin_name: string;
  notes?: string;
}

interface ParsedNotes {
  total_sessions: number;
  remaining_sessions: number;
  logs: SessionLog[];
}

export default function TrainerSessionsPage() {
  const { activeBranchID, user } = useAuth();
  
  // Navigation steps: 'list' | 'rekap' | 'lihat'
  const [step, setStep] = useState<'list' | 'rekap' | 'lihat'>('list');
  const [selectedReg, setSelectedReg] = useState<PTRegistration | null>(null);

  // Data states
  const [registrations, setRegistrations] = useState<PTRegistration[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Rekap Sesi Form fields
  const [rekapDate, setRekapDate] = useState('');
  const [rekapTime, setRekapTime] = useState('07:00');
  const [rekapTrainerName, setRekapTrainerName] = useState('');
  const [rekapUsedCount, setRekapUsedCount] = useState(1);
  const [rekapNotes, setRekapNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Printing State
  const [printReg, setPrintReg] = useState<PTRegistration | null>(null);

  useEffect(() => {
    if (activeBranchID) {
      fetchRegistrations();
      fetchTrainers();
    }
    const today = new Date().toISOString().split('T')[0];
    setRekapDate(today);
  }, [activeBranchID]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Backend now returns member_username inside PTRegistration list directly!
      const res = await ptRegistrationsApi.list(activeBranchID || '');
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await trainersApi.list(activeBranchID || '');
      if (res.success && res.data) {
        setTrainers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to parse notes JSON structure
  const parseNotes = (notesText: string = '', packageName: string = ''): ParsedNotes => {
    try {
      if (notesText && (notesText.startsWith('{') || notesText.startsWith('['))) {
        return JSON.parse(notesText);
      }
    } catch (e) {
      // Not JSON, fallback below
    }

    const total = getSessionCountFromPackage(packageName);
    return {
      total_sessions: total,
      remaining_sessions: total,
      logs: [],
    };
  };

  const handleOpenRekap = (reg: PTRegistration) => {
    setSelectedReg(reg);
    
    // Default trainer option with branch suffix
    const defaultTrainer = reg.trainer_name ? `${reg.trainer_name} - GROGOL` : '';
    setRekapTrainerName(defaultTrainer);
    setRekapUsedCount(1);
    setRekapNotes('');
    setFormError('');
    setFormSuccess('');
    setStep('rekap');
  };

  const handleOpenLihat = (reg: PTRegistration) => {
    setSelectedReg(reg);
    setStep('lihat');
  };

  const handleSaveRekap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const parsed = parseNotes(selectedReg.notes || '', selectedReg.package_name);
    
    if (rekapUsedCount > parsed.remaining_sessions) {
      setFormError(`Jumlah sesi terpakai tidak boleh melebihi sisa sesi (${parsed.remaining_sessions})!`);
      setSubmitting(false);
      return;
    }

    // Create new log entry
    const newLog: SessionLog = {
      date: rekapDate,
      time: rekapTime,
      trainer_name: rekapTrainerName,
      used_sessions: rekapUsedCount,
      admin_name: user?.full_name || 'Kasir Prabu GYM',
      notes: rekapNotes,
    };

    const updatedData: ParsedNotes = {
      total_sessions: parsed.total_sessions,
      remaining_sessions: parsed.remaining_sessions - rekapUsedCount,
      logs: [newLog, ...parsed.logs],
    };

    try {
      const res = await ptRegistrationsApi.updateNotes(selectedReg.id, JSON.stringify(updatedData));
      if (res.success) {
        setFormSuccess('Rekap sesi latihan berhasil disimpan!');
        // Refresh registrations
        fetchRegistrations();
        setTimeout(() => {
          setStep('list');
        }, 1200);
      } else {
        setFormError(res.error || 'Gagal menyimpan rekap sesi.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredRegistrations = () => {
    return registrations.filter(reg => {
      // Filter by search query (member name, username, package name)
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        reg.member_name.toLowerCase().includes(q) ||
        (reg.member_username && reg.member_username.toLowerCase().includes(q)) ||
        reg.package_name.toLowerCase().includes(q);

      // Filter by selected member filter dropdown
      if (selectedMemberFilter !== 'Semua') {
        return matchQuery && reg.member_id === selectedMemberFilter;
      }
      return matchQuery;
    });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedMemberFilter('Semua');
  };

  // Columns definition for DataTable
  const columns: Column<PTRegistration>[] = [
    {
      key: 'no',
      header: 'No',
      align: 'center',
      className: 'w-12',
      render: (_, idx) => idx + 1
    },
    {
      key: 'member_username',
      header: 'Nomor Anggota',
      className: 'font-mono text-slate-800',
      render: (r) => r.member_username ? `@${r.member_username}` : '-'
    },
    {
      key: 'member_name',
      header: 'Nama Anggota',
      className: 'font-bold text-slate-800'
    },
    {
      key: 'package_name',
      header: 'Paket Latihan',
      className: 'text-slate-800 font-medium uppercase text-xs'
    },
    {
      key: 'trainer_name',
      header: 'Trainer',
      className: 'text-slate-650'
    },
    {
      key: 'remaining_sessions',
      header: 'Sisa Sesi',
      align: 'center',
      className: 'w-24',
      render: (r) => {
        const parsed = parseNotes(r.notes || '', r.package_name);
        return `${parsed.remaining_sessions} / ${parsed.total_sessions}`;
      }
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      className: 'w-44',
      render: (r) => (
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button
            onClick={() => handleOpenRekap(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#007BFF] hover:bg-[#0069d9] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Rekap Sesi
          </button>
          <button
            onClick={() => handleOpenLihat(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
          >
            <List className="w-3.5 h-3.5" />
            Detail
          </button>
          <button
            onClick={() => setPrintReg(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#17A2B8] hover:bg-[#138496] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      )
    }
  ];

  const uniqueMembers = Array.from(new Map(registrations.map(item => [item.member_id, item])).values());
  const filteredData = getFilteredRegistrations();

  return (
    <div className="space-y-8 font-sans">
      <div className="no-print space-y-6">
        
        {/* Step 1: Listing (Daftar Sesi Latihan) */}
        {step === 'list' && (
          <div className="space-y-6 animate-fadeIn">
            <PageHeader 
              title="Sesi Latihan Pelatih" 
              description="Daftar Pelacakan Kehadiran & Sisa Sesi Latihan Anggota" 
            />

            {/* Pencarian Filter */}
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari nama anggota, nomor HP..."
              onReset={handleResetSearch}
            >
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded"
              >
                <option value="Semua">-Pilih Anggota-</option>
                {uniqueMembers.map((m) => (
                  <option key={m.id} value={m.member_id}>
                    {m.member_name}
                  </option>
                ))}
              </select>
            </SearchFilterBar>

            {/* Registrations Table */}
            <DataTable
              title="Daftar Latihan Member"
              columns={columns}
              data={filteredData}
              loading={loading}
              loadingMessage="Loading data sesi..."
              emptyMessage="Tidak ada data pendaftaran PT ditemukan."
            />
          </div>
        )}

        {/* Step 2: Rekap Sesi Form */}
        {step === 'rekap' && selectedReg && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <PageHeader
              title="Rekap Kehadiran Sesi Pelatih"
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

            <div className="bg-white border border-slate-200 rounded shadow-sm p-8 space-y-6 text-sm text-slate-700">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">
                Informasi Sesi
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold max-sm:grid-cols-1">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-400 font-accent uppercase text-[9px] mb-1">Nama Anggota</div>
                  <div className="text-sm font-bold text-slate-800">{selectedReg.member_name}</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-400 font-accent uppercase text-[9px] mb-1">Paket Latihan</div>
                  <div className="text-sm font-bold text-slate-800 uppercase">{selectedReg.package_name}</div>
                </div>
              </div>

              <form onSubmit={handleSaveRekap} className="space-y-5 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-[1.5fr_3fr] gap-4 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={rekapDate}
                    onChange={(e) => setRekapDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-4 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Waktu</label>
                  <input
                    type="time"
                    required
                    value={rekapTime}
                    onChange={(e) => setRekapTime(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-mono"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-4 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Pelatih / Trainer</label>
                  <input
                    type="text"
                    required
                    value={rekapTrainerName}
                    onChange={(e) => setRekapTrainerName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-4 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Sesi Terpakai</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRekapUsedCount(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded flex items-center justify-center font-bold text-slate-700 select-none cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-black font-mono text-slate-800">
                      {rekapUsedCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRekapUsedCount(prev => prev + 1)}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded flex items-center justify-center font-bold text-slate-700 select-none cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[1.5fr_3fr] gap-4 items-start max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent mt-2">Keterangan / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Latihan Chest & Triceps..."
                    value={rekapNotes}
                    onChange={(e) => setRekapNotes(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full resize-none font-body"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Menyimpan...' : 'Simpan Rekap'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Lihat Detail Log Sesi Latihan */}
        {step === 'lihat' && selectedReg && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <PageHeader
              title="Riwayat Sesi Latihan"
              action={
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrintReg(selectedReg)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kartu</span>
                  </button>
                  <button
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>
              }
            />

            {/* Info Summary Panel */}
            <div className="bg-white border border-slate-200 rounded shadow-sm p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">
                Detail Latihan
              </h3>
              <div className="border border-slate-200 overflow-hidden rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nama Anggota</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{selectedReg.member_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Paket Latihan</td>
                      <td className="py-2.5 px-4 uppercase text-slate-800 font-bold">{selectedReg.package_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Masa Aktif</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{formatDateLabel(calculateExpiryDate(selectedReg.registration_date))}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Pelatih</td>
                      <td className="py-2.5 px-4 text-slate-800">{selectedReg.trainer_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Jumlah Sesi</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{parseNotes(selectedReg.notes || '', selectedReg.package_name).total_sessions} Sesi</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Sisa Sesi</td>
                      <td className="py-2.5 px-4 font-black text-[#DC3545]">{parseNotes(selectedReg.notes || '', selectedReg.package_name).remaining_sessions} Sesi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold border-b border-slate-100 pb-2 text-slate-800">
                Log Kehadiran Sesi Latihan
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                  <thead className="bg-[#6C7A89] text-white text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-250 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-250">Tanggal</th>
                      <th className="py-2.5 px-3 border-r border-slate-250">Waktu</th>
                      <th className="py-2.5 px-3 border-r border-slate-250">Nama Trainer</th>
                      <th className="py-2.5 px-3 border-r border-slate-250 text-center">Sesi Terpakai</th>
                      <th className="py-2.5 px-3 border-r border-slate-250">Staff / CS</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700 font-semibold">
                    {parseNotes(selectedReg.notes || '', selectedReg.package_name).logs.length > 0 ? (
                      parseNotes(selectedReg.notes || '', selectedReg.package_name).logs.map((log, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(log.date)}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{log.time}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{log.trainer_name}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-800">{log.used_sessions} Sesi</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{log.admin_name}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-normal leading-relaxed">{log.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wider text-[10px]">
                          Belum ada riwayat sesi latihan.
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

      {/* Reusable Print Trainer Session Card Overlay */}
      {printReg && (
        <SessionReceiptTemplate
          onClose={() => setPrintReg(null)}
          data={{
            memberName: printReg.member_name,
            packageName: printReg.package_name,
            expiryDate: calculateExpiryDate(printReg.registration_date),
            totalSessions: parseNotes(printReg.notes || '', printReg.package_name).total_sessions,
            remainingSessions: parseNotes(printReg.notes || '', printReg.package_name).remaining_sessions,
            trainerName: printReg.trainer_name,
            logs: parseNotes(printReg.notes || '', printReg.package_name).logs
          }}
        />
      )}
    </div>
  );
}
