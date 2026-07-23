'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Plus, Minus, Save, ArrowLeft, ClipboardCheck, Search, FileText } from 'lucide-react';

interface PTRegistration {
  id: string;
  branch_id: string;
  member_id: string;
  member_name: string;
  trainer_id: string;
  trainer_name: string;
  registration_date: string;
  package_name: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  created_at: string;
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

interface ClassRecapDisplay {
  id: string; // pt registration ID
  member_name: string;
  class_name: string;
  instructor_name: string;
  date: string;
  time: string;
  used_sessions: number;
  commission: string;
}

export default function ClassRecapPage() {
  const { activeBranchID, user } = useAuth();
  
  // Navigation steps: 'list' | 'add'
  const [step, setStep] = useState<'list' | 'add'>('list');

  // Data states
  const [registrations, setRegistrations] = useState<PTRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedRegId, setSelectedRegId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [rekapDate, setRekapDate] = useState('');
  const [rekapTime, setRekapTime] = useState('');
  const [sessionCount, setSessionCount] = useState(1);
  const [classCommission, setClassCommission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeBranchID) {
      fetchRegistrations();
    }
    const today = new Date();
    setRekapDate(today.toISOString().split('T')[0]);
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    setRekapTime(`${hours}:${minutes}`);
  }, [activeBranchID]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/admin/pt-registrations?branch_id=${activeBranchID}`);
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseNotes = (notesText: string = '', packageName: string = ''): ParsedNotes => {
    try {
      if (notesText && (notesText.startsWith('{') || notesText.startsWith('['))) {
        return JSON.parse(notesText);
      }
    } catch (e) {
      // Fallback below
    }

    let total = 1;
    if (packageName.includes('12 Sesi')) total = 12;
    else if (packageName.includes('6 Sesi')) total = 6;
    else if (packageName.includes('3 Sesi')) total = 3;
    else if (packageName.includes('2 Sesi')) total = 2;
    else if (packageName.includes('1 Sesi')) total = 1;

    return {
      total_sessions: total,
      remaining_sessions: total,
      logs: [],
    };
  };

  // Get all logs that represent a Class Recap/Rapel across all registrations
  const getAllClassRecaps = (): ClassRecapDisplay[] => {
    const list: ClassRecapDisplay[] = [];
    registrations.forEach(reg => {
      const parsed = parseNotes(reg.notes || '', reg.package_name);
      parsed.logs.forEach((log) => {
        // Look for logs that contain Recap/Rapel in notes
        if (log.notes && (log.notes.includes('Rekap') || log.notes.includes('Rapel'))) {
          // Extract commission from notes if present
          let commission = '-';
          const commMatch = log.notes.match(/Komisi:\s*(.+)$/);
          if (commMatch) {
            commission = commMatch[1];
          }
          list.push({
            id: reg.id,
            member_name: reg.member_name,
            class_name: reg.package_name,
            instructor_name: log.trainer_name,
            date: log.date,
            time: log.time,
            used_sessions: log.used_sessions,
            commission: commission,
          });
        }
      });
    });
    // Sort by date and time descending
    return list.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  };

  // Autofill trainer name when a registration is selected
  useEffect(() => {
    if (!selectedRegId) {
      setInstructorName('');
      return;
    }
    const reg = registrations.find(r => r.id === selectedRegId);
    if (reg) {
      setInstructorName(reg.trainer_name);
    }
  }, [selectedRegId, registrations]);

  const handleOpenAdd = () => {
    setSelectedRegId('');
    setInstructorName('');
    setSessionCount(1);
    setClassCommission('');
    setFormError('');
    setFormSuccess('');
    
    const today = new Date();
    setRekapDate(today.toISOString().split('T')[0]);
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    setRekapTime(`${hours}:${minutes}`);

    setStep('add');
  };

  const handleSaveRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegId || !instructorName) {
      setFormError('Nama Kelas dan Nama Instruktur wajib dipilih!');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const reg = registrations.find(r => r.id === selectedRegId);
    if (!reg) {
      setFormError('Data pelatihan tidak ditemukan');
      setSubmitting(false);
      return;
    }

    const parsed = parseNotes(reg.notes || '', reg.package_name);
    if (sessionCount > parsed.remaining_sessions) {
      setFormError(`Sesi tidak mencukupi! Sisa sesi yang tersedia: ${parsed.remaining_sessions}`);
      setSubmitting(false);
      return;
    }

    const newLog: SessionLog = {
      date: rekapDate,
      time: rekapTime,
      trainer_name: instructorName,
      used_sessions: sessionCount,
      admin_name: user?.full_name || 'Admin',
      notes: `Rekap Kelas Rapel. Komisi: ${classCommission || '-'}`,
    };

    const updatedData: ParsedNotes = {
      total_sessions: parsed.total_sessions,
      remaining_sessions: parsed.remaining_sessions - sessionCount,
      logs: [newLog, ...parsed.logs],
    };

    try {
      const res = await api.put<any>(`/admin/pt-registrations/${reg.id}`, {
        notes: JSON.stringify(updatedData),
      });

      if (res.success) {
        setFormSuccess('Rekap kelas berhasil disimpan dan sesi pelatihan telah dikurangi!');
        fetchRegistrations();
        setTimeout(() => {
          setStep('list');
        }, 1200);
      } else {
        setFormError(res.error || 'Gagal menyimpan rekap kelas.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredRecaps = () => {
    const list = getAllClassRecaps();
    return list.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        item.member_name.toLowerCase().includes(q) ||
        item.class_name.toLowerCase().includes(q) ||
        item.instructor_name.toLowerCase().includes(q)
      );
    });
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Step 1: List View (Riwayat Rekap Kelas) */}
      {step === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-heading text-slate-800">REKAP KELAS SENAM / PILATES</h2>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
                Rapel Kelas Latihan & Pengurangan Sesi Otomatis Anggota
              </p>
            </div>
            
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Tambah Rekap Kelas</span>
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
                  placeholder="Cari nama anggota, kelas, atau instruktur..."
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

          {/* Table list of recaps */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
              Loading riwayat rekap kelas...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
                <span className="text-sm uppercase tracking-wider font-heading">Riwayat Rekap Kelas</span>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-650 border border-slate-200">
                    <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                      <tr>
                        <th className="py-3 px-4 border-r border-slate-350/40 w-12 text-center">No</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Tanggal & Waktu</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Nama Anggota</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Nama Kelas (Latihan)</th>
                        <th className="py-3 px-4 border-r border-slate-350/40">Instruktur</th>
                        <th className="py-3 px-4 border-r border-slate-350/40 text-center">Jumlah Sesi</th>
                        <th className="py-3 px-4 border-r border-slate-350/40 text-center">Komisi Kelas</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-xs">
                      {getFilteredRecaps().length > 0 ? (
                        getFilteredRecaps().map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 border-r border-slate-100 text-center">{idx + 1}</td>
                            <td className="py-4 px-4 border-r border-slate-100 font-mono text-slate-600">
                              {formatDateLabel(item.date)} {item.time}
                            </td>
                            <td className="py-4 px-4 border-r border-slate-100 text-slate-800 font-bold">{item.member_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 uppercase text-[10px]">{item.class_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-slate-850 font-bold">{item.instructor_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-center text-slate-900 font-bold">{item.used_sessions} Sesi</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-center font-bold text-emerald-650">{item.commission}</td>
                            <td className="py-4 px-4 text-center select-none">
                              <span className="inline-block px-2.5 py-1 bg-[#28A745] text-white text-[9px] font-accent uppercase tracking-wider rounded font-bold">
                                Selesai
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold select-none uppercase">
                            Belum ada riwayat rekap kelas.
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

      {/* Step 2: Form View (Tambah Rekap Kelas - Matching User Screenshot) */}
      {step === 'add' && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
          {/* Breadcrumb path label matching screen */}
          <div className="text-xs font-accent text-slate-450 uppercase tracking-widest select-none">
            Transaksi &gt; Rekap Kelas &gt; Tambah Rekap Kelas
          </div>

          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center gap-2 rounded-t">
            <Plus className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-heading">Tambah Rekap Kelas</span>
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
            <form onSubmit={handleSaveRecap} className="space-y-6 text-sm text-slate-700">
              
              {/* Nama Kelas (Pilih dari Pelatihan Aktif) */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Kelas *</label>
                <select
                  required
                  value={selectedRegId}
                  onChange={(e) => setSelectedRegId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold uppercase"
                >
                  <option value="">-Pilih-</option>
                  {registrations
                    .filter(r => parseNotes(r.notes || '', r.package_name).remaining_sessions > 0)
                    .map(r => {
                      const parsed = parseNotes(r.notes || '', r.package_name);
                      return (
                        <option key={r.id} value={r.id}>
                          {r.member_name} | {r.package_name} (Sisa: {parsed.remaining_sessions} Sesi)
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Nama Instruktur (Autofilled or selectable) */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Nama Instruktur *</label>
                <select
                  required
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold uppercase"
                >
                  <option value="">-Pilih-</option>
                  {/* Option for current instructor, plus other general defaults */}
                  {instructorName && (
                    <option value={instructorName}>{instructorName}</option>
                  )}
                  <option value="Andrea tutto">Andrea tutto</option>
                  <option value="Muhammad Tri">Muhammad Tri</option>
                </select>
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
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full cursor-pointer"
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                  />
                  <input
                    type="time"
                    required
                    value={rekapTime}
                    onChange={(e) => setRekapTime(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full cursor-pointer"
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                  />
                </div>
              </div>

              {/* Jumlah Anggota counter stepper */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Jumlah Anggota</label>
                <div className="flex items-center gap-1 w-32 border border-slate-200 rounded overflow-hidden select-none bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setSessionCount(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors border-r border-slate-200 cursor-pointer font-bold"
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-650" />
                  </button>
                  <input
                    type="number"
                    readOnly
                    value={sessionCount}
                    className="w-full text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = selectedRegId 
                        ? parseNotes(registrations.find(r => r.id === selectedRegId)?.notes || '', registrations.find(r => r.id === selectedRegId)?.package_name).remaining_sessions
                        : 10;
                      setSessionCount(prev => Math.min(maxVal, prev + 1));
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors border-l border-slate-200 cursor-pointer font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-650" />
                  </button>
                </div>
              </div>

              {/* Komisi Kelas */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">Komisi Kelas</label>
                <input
                  type="text"
                  value={classCommission}
                  onChange={(e) => setClassCommission(e.target.value)}
                  placeholder="Masukan Komisi Kelas"
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full"
                />
              </div>

              {/* Form Action Buttons */}
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
  );
}
