'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ClassRecap {
  id: string;
  class_name: string;
  instructor_name: string;
  schedule_time: string;
  capacity: number;
  enrolled_count: number;
  branch_name: string;
}

export default function ClassRecapPage() {
  const { activeBranchID } = useAuth();
  const [classes, setClasses] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranchID) {
      fetchClasses();
    }
  }, [activeBranchID]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Mock loading classes data
      setTimeout(() => {
        setClasses([
          {
            id: 'c1',
            class_name: 'Aerobik Pemula',
            instructor_name: 'Siska Amanda',
            schedule_time: 'Senin, 19:00 WIB',
            capacity: 25,
            enrolled_count: 18,
            branch_name: 'Grogol'
          },
          {
            id: 'c2',
            class_name: 'Pilates Reformer',
            instructor_name: 'Coach Jessica',
            schedule_time: 'Rabu, 17:30 WIB',
            capacity: 10,
            enrolled_count: 9,
            branch_name: 'Grogol'
          },
          {
            id: 'c3',
            class_name: 'Kungfu Kids Class',
            instructor_name: 'Master Wong',
            schedule_time: 'Sabtu, 09:00 WIB',
            capacity: 20,
            enrolled_count: 12,
            branch_name: 'Grogol'
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-heading text-slate-800">REKAP KELAS SENAM / PILATES</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-accent">
          Monitoring kuota & rekap peserta kelas aktif bulanan
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-accent uppercase tracking-widest text-xs">
          Loading rekap kelas...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#17A2B8] px-5 py-3 text-white font-bold select-none">
            <span className="text-sm uppercase tracking-wider">Daftar Jadwal & Kapasitas Kelas</span>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650">
                <thead className="bg-[#6C7A89] text-white text-[10px] uppercase tracking-wider font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-300/40">Nama Kelas</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Instruktur</th>
                    <th className="py-3 px-4 border-r border-slate-300/40">Jadwal Kelas</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Terdaftar</th>
                    <th className="py-3 px-4 border-r border-slate-300/40 text-center">Kapasitas</th>
                    <th className="py-3 px-4 text-center">Rasio Kuota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {classes.map((c) => {
                    const pct = Math.round((c.enrolled_count / c.capacity) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-100">{c.class_name}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-slate-800">{c.instructor_name}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 font-mono text-slate-550">{c.schedule_time}</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-center text-slate-850 font-bold">{c.enrolled_count} Orang</td>
                        <td className="py-3.5 px-4 border-r border-slate-100 text-center text-slate-500">{c.capacity} Slot</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
