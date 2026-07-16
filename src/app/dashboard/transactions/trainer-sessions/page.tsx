'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Search, Edit, Printer, List, ArrowLeft, Plus, Minus, Save, FileText } from 'lucide-react';

interface PTRegistration {
  id: string;
  branch_id: string;
  member_id: string;
  member_name: string;
  member_username?: string;
  trainer_id: string;
  trainer_name: string;
  registration_date: string;
  package_name: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  created_at: string;
}

interface Trainer {
  id: string;
  full_name: string;
}

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
      const res = await api.get<any>(`/admin/pt-registrations?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        // Enforce member username lookup to ensure data displays properly
        const list = res.data;
        const membersRes = await api.get<any>(`/admin/members?branch_id=${activeBranchID}&per_page=200`);
        if (membersRes.success && membersRes.data) {
          const membersList = membersRes.data;
          list.forEach((pt: PTRegistration) => {
            const match = membersList.find((m: any) => m.id === pt.member_id);
            if (match) pt.member_username = match.username;
          });
        }
        setRegistrations(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get<any>(`/admin/trainers?branch_id=${activeBranchID}`);
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

    // Fallback: derive total sessions from package name
    let total = 1;
    if (packageName.includes('2 Sesi')) total = 2;
    else if (packageName.includes('3 Sesi')) total = 3;
    else if (packageName.includes('6 Sesi')) total = 6;
    else if (packageName.includes('12 Sesi')) total = 12;

    return {
      total_sessions: total,
      remaining_sessions: total,
      logs: [],
    };
  };

  const calculateExpiryDate = (regDate: string) => {
    if (!regDate) return '-';
    const d = new Date(regDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const handleOpenRekap = (reg: PTRegistration) => {
    setSelectedReg(reg);
    const parsed = parseNotes(reg.notes || '', reg.package_name);
    
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
      const res = await api.put<any>(`/admin/pt-registrations/${selectedReg.id}`, {
        notes: JSON.stringify(updatedData),
      });

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

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Absolute CSS print layouts */}
      <style jsx global>{`
        @media print {
          header, aside, button, .no-print {
            display: none !important;
          }
          body, .min-h-screen, main, #print-session-receipt {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-session-receipt {
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

      {/* Main dashboard view wrapped in no-print wrapper */}
      <div className="no-print space-y-6">
        
        {/* Step 1: Listing (Daftar Sesi Latihan) */}
        {step === 'list' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-heading text-slate-800">SESI LATIHAN PELATIH</h2>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
                Daftar Pelacakan Kehadiran & Sisa Sesi Latihan Anggota
              </p>
            </div>

            {/* Pencarian Cyan Box (Image 1 Layout) */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider">Pencarian</span>
              </div>
              <div className="p-6">
                <div className="flex gap-4 flex-wrap items-center">
                  <div className="relative min-w-[280px]">
                    <select
                      value={selectedMemberFilter}
                      onChange={(e) => setSelectedMemberFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded font-bold uppercase"
                    >
                      <option value="Semua">-Pilih-</option>
                      {/* Unique members options */}
                      {Array.from(new Set(registrations.map(r => r.member_id))).map(mid => {
                        const reg = registrations.find(r => r.member_id === mid);
                        return (
                          <option key={mid} value={mid}>
                            {reg?.member_username || 'member'} | {reg?.member_name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Cari paket atau pelatih..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded min-w-[200px]"
                  />

                  <button
                    onClick={fetchRegistrations}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Pencarian</span>
                  </button>
                  <button
                    onClick={handleResetSearch}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tampilkan Semua</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sesi Table Container */}
            {loading ? (
              <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
                Loading data sesi latihan...
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-650 border border-slate-200">
                      <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                        <tr>
                          <th className="py-3 px-4 border-r border-slate-350/40 w-12 text-center">NO</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Masa Aktif</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nomor Anggota</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nama Anggota</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Nama Pelatih</th>
                          <th className="py-3 px-4 border-r border-slate-350/40">Paket Latihan</th>
                          <th className="py-3 px-4 border-r border-slate-350/40 text-center">Total Sesi</th>
                          <th className="py-3 px-4 border-r border-slate-350/40 text-center">Sisa Sesi</th>
                          <th className="py-3 px-4 border-r border-slate-350/40 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-xs">
                        {getFilteredRegistrations().length > 0 ? (
                          getFilteredRegistrations().map((reg, idx) => {
                            const parsed = parseNotes(reg.notes || '', reg.package_name);
                            const isActive = parsed.remaining_sessions > 0;
                            return (
                              <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 border-r border-slate-100 text-center">{idx + 1}</td>
                                <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-600">
                                  {formatDateLabel(calculateExpiryDate(reg.registration_date))}
                                </td>
                                <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-800">
                                  @{reg.member_username || 'member'}
                                </td>
                                <td className="py-4 px-4 border-r border-slate-100 text-slate-800 font-bold">{reg.member_name}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-slate-800">{reg.trainer_name}</td>
                                <td className="py-4 px-4 border-r border-slate-100 uppercase text-[10px]">{reg.package_name}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-center text-slate-600">{parsed.total_sessions}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-center text-slate-900 font-bold">{parsed.remaining_sessions}</td>
                                <td className="py-4 px-4 border-r border-slate-100 text-center select-none">
                                  {isActive ? (
                                    <span className="inline-block px-2.5 py-1 bg-[#28A745] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
                                      Sesi Aktif
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 bg-[#DC3545] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
                                      Habis
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-center select-none">
                                  <div className="flex flex-col gap-1 items-center justify-center">
                                    <button
                                      onClick={() => handleOpenRekap(reg)}
                                      disabled={!isActive}
                                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors disabled:opacity-40"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Rekap Sesi
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPrintReg(reg);
                                        setTimeout(() => {
                                          window.print();
                                        }, 100);
                                      }}
                                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-350 text-slate-800 font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors shadow-xs"
                                    >
                                      <Printer className="w-3 h-3" />
                                      Cetak
                                    </button>
                                    <button
                                      onClick={() => handleOpenLihat(reg)}
                                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#007BFF] hover:bg-[#0069d9] text-white font-bold uppercase text-[9px] tracking-wider rounded cursor-pointer transition-colors"
                                    >
                                      <List className="w-3 h-3" />
                                      Lihat Sesi
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold select-none uppercase">
                              Tidak ada data sesi latihan pelatih.
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

        {/* Step 2: Rekap Sesi Form (Image 3 Layout) */}
        {step === 'rekap' && selectedReg && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
              <Edit className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider font-heading">Rekap Sesi</span>
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
              <form onSubmit={handleSaveRekap} className="space-y-6 text-sm text-slate-700">
                
                {/* Nama Anggota */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Anggota</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedReg.member_name}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-bold"
                  />
                </div>

                {/* Paket Anggota */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Paket Anggota</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedReg.package_name}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full uppercase"
                  />
                </div>

                {/* Sisa Sesi */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Sisa Sesi</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={parseNotes(selectedReg.notes || '', selectedReg.package_name).remaining_sessions}
                    className="bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2.5 text-xs focus:outline-none rounded w-full font-mono font-bold"
                  />
                </div>

                {/* Tanggal dan Waktu */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Tanggal dan Waktu</label>
                  <div className="flex gap-4">
                    <input
                      type="date"
                      required
                      value={rekapDate}
                      onChange={(e) => setRekapDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                    />
                    <input
                      type="time"
                      required
                      value={rekapTime}
                      onChange={(e) => setRekapTime(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                    />
                  </div>
                </div>

                {/* Nama Pelatih (Grogol, Pancoran Mas, Limo) */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Pelatih *</label>
                  <select
                    required
                    value={rekapTrainerName}
                    onChange={(e) => setRekapTrainerName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold"
                  >
                    <option value="">-Pilih-</option>
                    {/* Add Grogol, Pancoran Mas, Limo suffixes for each loaded trainer */}
                    {trainers.map(t => (
                      <optgroup key={t.id} label={t.full_name}>
                        <option value={`${t.full_name} - GROGOL`}>{t.full_name} - GROGOL</option>
                        <option value={`${t.full_name} - PANCORAN MAS`}>{t.full_name} - PANCORAN MAS</option>
                        <option value={`${t.full_name} - LIMO`}>{t.full_name} - LIMO</option>
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Jumlah Sesi counter */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Jumlah Sesi</label>
                  <div className="flex items-center gap-1 w-32 border border-slate-200 rounded overflow-hidden select-none bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setRekapUsedCount(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors border-r border-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-650" />
                    </button>
                    <input
                      type="number"
                      readOnly
                      value={rekapUsedCount}
                      className="w-full text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setRekapUsedCount(prev => Math.min(parseNotes(selectedReg.notes || '', selectedReg.package_name).remaining_sessions, prev + 1))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors border-l border-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-650" />
                    </button>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                  <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Keterangan</label>
                  <textarea
                    value={rekapNotes}
                    onChange={(e) => setRekapNotes(e.target.value)}
                    placeholder="Masukan Keterangan"
                    rows={4}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full resize-none h-[80px]"
                  />
                </div>

                {/* Submit actions */}
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

        {/* Step 3: Lihat Sesi Page (Image 4 Layout) */}
        {step === 'lihat' && selectedReg && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header cyan bar */}
            <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
              <List className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider font-heading">Lihat Sesi</span>
            </div>

            <div className="flex gap-4 select-none">
              <button
                onClick={() => setStep('list')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              {parseNotes(selectedReg.notes || '', selectedReg.package_name).remaining_sessions > 0 && (
                <button
                  onClick={() => handleOpenRekap(selectedReg)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Rekap Sesi</span>
                </button>
              )}
            </div>

            {/* Info Table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6">
              <div className="border border-slate-200 overflow-hidden rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200 w-[25%]">Nama Anggota</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{selectedReg.member_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Paket Latihan</td>
                      <td className="py-2.5 px-4 uppercase text-slate-800">{selectedReg.package_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Masa Aktif</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{formatDateLabel(calculateExpiryDate(selectedReg.registration_date))}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Jumlah Sesi</td>
                      <td className="py-2.5 px-4 text-slate-800">{parseNotes(selectedReg.notes || '', selectedReg.package_name).total_sessions}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Sisa Sesi</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{parseNotes(selectedReg.notes || '', selectedReg.package_name).remaining_sessions}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-slate-200">Pelatih</td>
                      <td className="py-2.5 px-4 text-slate-700">{selectedReg.trainer_name}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Session usage history table */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 select-none">Log Penggunaan Sesi</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                  <thead className="bg-[#6C7A89] text-white text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Tanggal</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Waktu</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Nama Pelatih</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">Sesi Terpakai</th>
                      <th className="py-2.5 px-3">Nama Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {parseNotes(selectedReg.notes || '', selectedReg.package_name).logs.length > 0 ? (
                      parseNotes(selectedReg.notes || '', selectedReg.package_name).logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{formatDateLabel(log.date)}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono">{log.time}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-bold">{log.trainer_name}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-900 font-black">{log.used_sessions}</td>
                          <td className="py-2.5 px-3 text-slate-600">{log.admin_name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-bold select-none uppercase tracking-wide">
                          Belum ada sesi latihan yang direkap.
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

      {/* Session Member Print Receipt popup (Image 5 Layout) */}
      {printReg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 p-8 rounded shadow-2xl relative text-black">
            <button
              onClick={() => setPrintReg(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* Print Area */}
            <div id="print-session-receipt" className="space-y-6">
              
              {/* Header Box */}
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
                    PRABU SESSION MEMBER
                  </h2>
                </div>
              </div>

              {/* Details table (vertical list format matching Image 5) */}
              <div className="border border-black overflow-hidden rounded-xs text-xs font-semibold">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black w-[30%]">Nama Anggota</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{printReg.member_name}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Paket Latihan</td>
                      <td className="py-2.5 px-4 uppercase text-slate-800">{printReg.package_name}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Masa Aktif</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{formatDateLabel(calculateExpiryDate(printReg.registration_date))}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Jumlah Sesi</td>
                      <td className="py-2.5 px-4 text-slate-800">{parseNotes(printReg.notes || '', printReg.package_name).total_sessions}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Sisa Sesi</td>
                      <td className="py-2.5 px-4 font-bold text-slate-850">{parseNotes(printReg.notes || '', printReg.package_name).remaining_sessions}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-bold bg-slate-50 border-r border-black">Pelatih</td>
                      <td className="py-2.5 px-4 text-slate-700">{printReg.trainer_name}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Log History list on printed receipt */}
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-700">Riwayat Penggunaan Sesi:</div>
                <div className="border border-black overflow-hidden rounded-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black font-extrabold uppercase text-[9px] text-slate-700">
                        <th className="py-2 px-3 border-r border-black w-8 text-center">No</th>
                        <th className="py-2 px-3 border-r border-black">Tanggal</th>
                        <th className="py-2 px-3 border-r border-black">Waktu</th>
                        <th className="py-2 px-3 border-r border-black">Nama Pelatih</th>
                        <th className="py-2 px-3 border-r border-black text-center">Sesi Terpakai</th>
                        <th className="py-2 px-3">Nama CS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseNotes(printReg.notes || '', printReg.package_name).logs.length > 0 ? (
                        parseNotes(printReg.notes || '', printReg.package_name).logs.map((log, index) => (
                          <tr key={index} className="font-semibold text-slate-800 border-b border-black last:border-b-0">
                            <td className="py-2 px-3 border-r border-black text-center">{index + 1}</td>
                            <td className="py-2 px-3 border-r border-black font-mono">{formatDateLabel(log.date)}</td>
                            <td className="py-2 px-3 border-r border-black font-mono">{log.time}</td>
                            <td className="py-2 px-3 border-r border-black">{log.trainer_name}</td>
                            <td className="py-2 px-3 border-r border-black text-center font-bold">{log.used_sessions}</td>
                            <td className="py-2 px-3">{log.admin_name}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 font-bold select-none uppercase tracking-wider">
                            Belum ada riwayat penggunaan sesi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Print actions overlay */}
            <div className="mt-6 flex justify-end gap-4 no-print select-none">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase rounded cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Receipt
              </button>
              <button
                onClick={() => setPrintReg(null)}
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
