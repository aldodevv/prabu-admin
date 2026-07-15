'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LogOut, ArrowRight, Check } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function BranchSelectPage() {
  const { user, selectBranch, logout } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If karyawan, they are auto-routed in AuthContext
    if (user && user.role === 'karyawan') {
      router.push('/dashboard');
      return;
    }

    async function fetchBranches() {
      try {
        const res = await api.get<Branch[]>('/admin/branches');
        if (res.success && res.data) {
          setBranches(res.data);
        } else {
          // fallback
          setBranches([
            { id: 'branch-grogol-uuid', name: 'PRABU GYM GROGOL', code: 'PRB-GRG' },
            { id: 'branch-limo-uuid', name: 'PRABU GYM LIMO', code: 'PRB-LMO' },
            { id: 'branch-pancoran-mas-uuid', name: 'PRABU GYM PANCORAN MAS', code: 'PRB-PAC' },
          ]);
        }
      } catch {
        setBranches([
          { id: 'branch-grogol-uuid', name: 'PRABU GYM GROGOL', code: 'PRB-GRG' },
          { id: 'branch-limo-uuid', name: 'PRABU GYM LIMO', code: 'PRB-LMO' },
          { id: 'branch-pancoran-mas-uuid', name: 'PRABU GYM PANCORAN MAS', code: 'PRB-PAC' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchBranches();
    }
  }, [user, router]);

  const handleSelect = (branchID: string) => {
    selectBranch(branchID);
    router.push('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-stretch font-sans">
      {/* Left Pane - Gym Imagery (Visible on Large Screens) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center items-center justify-center p-12 overflow-hidden"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        
        {/* Glow decorative rings */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-red-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-lg text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-orange-400">
            🔒 Pemilihan Akses Cabang
          </div>
          <h1 className="text-5xl font-heading tracking-wide leading-tight text-white drop-shadow-md">
            HAVE A GREAT DAY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
              PRABUGYM PARTNER
            </span>
          </h1>
          <p className="text-slate-200 text-lg font-light leading-relaxed">
            Pilih cabang aktif untuk memulai pemantauan transaksi harian, aktivitas member, dan monitoring kehadiran karyawan di cabang Anda.
          </p>
        </div>
      </div>

      {/* Right Pane - Branch Selection Panel */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-8 sm:p-16 md:p-20 relative">
        {/* Top Spacer or Small Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Level Akses: {user.role}
          </span>
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Center Panel Container */}
        <div className="w-full max-w-xl mx-auto my-auto space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-heading text-slate-800 tracking-wide">
              HAVE A GREAT DAY
            </h2>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mt-1">
              SELECT YOUR CLUB
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm font-semibold">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
              <span>Menghubungkan ke database pusat...</span>
            </div>
          ) : (
            <div className="border border-slate-100 rounded overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#4F5B66] text-white uppercase text-[11px] tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-16 text-center">No</th>
                    <th className="py-3.5 px-4">Club Name</th>
                    <th className="py-3.5 px-4 w-28 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {branches.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-center font-semibold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 tracking-wide uppercase text-xs">
                        {b.name}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleSelect(b.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 hover:text-white border-2 border-orange-500/80 hover:bg-orange-500 rounded transition-all duration-150 cursor-pointer shadow-sm shadow-orange-500/5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>Login</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 font-semibold mt-8">
          2020 © Ampaba Development
        </div>
      </div>
    </div>
  );
}
