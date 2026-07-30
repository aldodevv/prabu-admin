'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { packagesApi, trainersApi, contentsApi } from '@/core/api';
import { GymClass, Trainer } from '@/core/types';
import { Plus, Minus, Save, ArrowLeft, ClipboardCheck, Search, FileText } from 'lucide-react';
import Link from 'next/link';

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
  id: string;
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

  // Master Data states
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [recapLogs, setRecapLogs] = useState<ClassRecapDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedClassName, setSelectedClassName] = useState('');
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
    fetchData();
    const today = new Date();
    setRekapDate(today.toISOString().split('T')[0]);
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    setRekapTime(`${hours}:${minutes}`);
  }, [activeBranchID]);

  const parseNotes = (notesText: string = '', packageName: string = ''): ParsedNotes => {
    try {
      if (notesText && (notesText.startsWith('{') || notesText.startsWith('['))) {
        return JSON.parse(notesText);
      }
    } catch (e) {
      // Fallback
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, trainersRes, contentsRes, ptRegsRes]: any[] = await Promise.all([
        packagesApi.listGymClasses(activeBranchID || undefined).catch(() => ({ success: false, data: [] })),
        trainersApi.list(activeBranchID || undefined).catch(() => ({ success: false, data: [] })),
        contentsApi.listAdmin('class_recap').catch(() => ({ success: false, data: [] })),
        api.get<any>(`/admin/pt-registrations?branch_id=${activeBranchID || ''}`).catch(() => ({ success: false, data: [] })),
      ]);

      if (classesRes && Array.isArray(classesRes.data)) {
        setGymClasses(classesRes.data);
      }
      if (trainersRes && Array.isArray(trainersRes.data)) {
        setTrainers(trainersRes.data);
      }

      const list: ClassRecapDisplay[] = [];

      // 1. Load from contents API (Persisted Class Recaps)
      if (contentsRes && Array.isArray(contentsRes.data)) {
        contentsRes.data.forEach((item: any) => {
          const meta = item.metadata || {};
          list.push({
            id: item.id,
            member_name: meta.member_name || 'Kelas Umum',
            class_name: meta.class_name || item.title,
            instructor_name: meta.instructor_name || item.description,
            date: meta.date || (item.created_at ? item.created_at.split('T')[0] : ''),
            time: meta.time || '10:00',
            used_sessions: meta.used_sessions || 1,
            commission: meta.commission || '-',
          });
        });
      }

      // 2. Load from PT registrations (for backward compatibility)
      if (ptRegsRes && ptRegsRes.success && Array.isArray(ptRegsRes.data)) {
        ptRegsRes.data.forEach((reg: any) => {
          const parsed = parseNotes(reg.notes || '', reg.package_name);
          parsed.logs.forEach((log) => {
            if (log.notes && (log.notes.includes('Rekap') || log.notes.includes('Rapel'))) {
              let commission = '-';
              const commMatch = log.notes.match(/Komisi:\s*(.+)$/);
              if (commMatch) commission = commMatch[1];

              list.push({
                id: reg.id + '_' + log.date + '_' + log.time,
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
      }

      // Sort by date & time descending
      list.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
      setRecapLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedClassName('');
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
    if (!selectedClassName || !instructorName) {
      setFormError('Nama Kelas dan Nama Instruktur wajib dipilih!');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const recapPayload = {
        type: 'class_recap',
        title: selectedClassName,
        description: instructorName,
        is_published: true,
        metadata: {
          branch_id: activeBranchID,
          class_name: selectedClassName,
          instructor_name: instructorName,
          date: rekapDate,
          time: rekapTime,
          used_sessions: sessionCount,
          commission: classCommission || '-',
          created_by: user?.full_name || 'Admin',
        }
      };

      await contentsApi.create(recapPayload);
      setFormSuccess('Rekap kelas berhasil disimpan!');
      fetchData();
      setTimeout(() => {
        setStep('list');
      }, 1200);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan rekap kelas.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredRecaps = () => {
    return recapLogs.filter(item => {
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
    if (isNaN(d.getTime())) return dateStr;
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
                Rapel Kelas Latihan & Presensi Kehadiran Anggota
              </p>
            </div>
            
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-xs"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Tambah Rekap Kelas</span>
            </button>
          </div>

          {/* Pencarian Box */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
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
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-xs"
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
            <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
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
                        <th className="py-3 px-4 border-r border-slate-350/40 text-center">Jumlah Anggota</th>
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
                            <td className="py-4 px-4 border-r border-slate-100 uppercase text-[10px] font-bold text-slate-800">{item.class_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-slate-850 font-bold">{item.instructor_name}</td>
                            <td className="py-4 px-4 border-r border-slate-100 text-center text-slate-900 font-bold">{item.used_sessions} Orang</td>
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

          <div className="bg-white border border-slate-200 p-8 rounded shadow-xs">
            <form onSubmit={handleSaveRecap} className="space-y-6 text-sm text-slate-700">
              
              {/* Nama Kelas (Terhubung ke Pengaturan -> Daftar Nama Kelas) */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                  Nama Kelas *
                </label>
                <div>
                  <select
                    required
                    value={selectedClassName}
                    onChange={(e) => setSelectedClassName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold uppercase"
                  >
                    <option value="">-Pilih-</option>
                    {gymClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {gymClasses.length === 0 && (
                      <>
                        <option value="Aerobik">Aerobik</option>
                        <option value="Yoga">Yoga</option>
                        <option value="Zumba">Zumba</option>
                        <option value="Pilates">Pilates</option>
                        <option value="Body Combat">Body Combat</option>
                      </>
                    )}
                  </select>
                  {gymClasses.length === 0 && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Daftar kelas kosong.{' '}
                      <Link href="/dashboard/settings/classes" className="text-blue-600 underline font-semibold">
                        Tambah di Pengaturan &gt; Daftar Nama Kelas
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Nama Instruktur (Terhubung ke Daftar Pelatih / Staff) */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                  Nama Instruktur *
                </label>
                <select
                  required
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC3545] rounded w-full font-bold uppercase"
                >
                  <option value="">-Pilih-</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.full_name}>
                      {t.full_name}
                    </option>
                  ))}
                  {trainers.length === 0 && (
                    <>
                      <option value="Andrea tutto">Andrea tutto</option>
                      <option value="Muhammad Tri">Muhammad Tri</option>
                    </>
                  )}
                </select>
              </div>

              {/* Tanggal dan Waktu */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                  Tanggal dan Waktu
                </label>
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
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                  Jumlah Anggota
                </label>
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
                    onClick={() => setSessionCount(prev => prev + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors border-l border-slate-200 cursor-pointer font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-650" />
                  </button>
                </div>
              </div>

              {/* Komisi Kelas */}
              <div className="grid grid-cols-[1.5fr_3fr] gap-6 items-center max-sm:grid-cols-1">
                <label className="text-xs font-semibold text-right max-sm:text-left uppercase tracking-wider text-slate-500 font-accent">
                  Komisi Kelas
                </label>
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
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#28A745] hover:bg-[#218838] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('list')}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#DC3545] hover:bg-[#c82333] text-white text-xs font-accent font-bold uppercase tracking-widest rounded transition-colors shadow-xs cursor-pointer"
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
