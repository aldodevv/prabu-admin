'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
            { id: 'branch-grogol-uuid', name: 'Prabu Gym Grogol', code: 'PRB-GRG' },
            { id: 'branch-limo-uuid', name: 'Prabu Gym Limo', code: 'PRB-LMO' },
            { id: 'branch-pancoran-mas-uuid', name: 'Prabu Gym Pancoran Mas', code: 'PRB-PAC' },
          ]);
        }
      } catch {
        setBranches([
          { id: 'branch-grogol-uuid', name: 'Prabu Gym Grogol', code: 'PRB-GRG' },
          { id: 'branch-limo-uuid', name: 'Prabu Gym Limo', code: 'PRB-LMO' },
          { id: 'branch-pancoran-mas-uuid', name: 'Prabu Gym Pancoran Mas', code: 'PRB-PAC' },
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
    <div className="min-h-screen bg-black-deep flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[100px] bg-red-primary" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-[120px] bg-red-dark" />

      <div className="w-full max-w-2xl bg-black-card/40 backdrop-blur-[30px] border border-gray-800 p-8 angular-cut relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-primary to-transparent" />

        <div className="text-center mb-8">
          <span className="font-accent text-xs uppercase tracking-widest text-red-primary">LEVEL AKSES: {user.role.toUpperCase()}</span>
          <h2 className="text-3xl font-heading text-white mt-1">PILIH CABANG GYM</h2>
          <p className="text-gray-400 text-sm mt-1">
            Silakan pilih cabang untuk mengakses data operasional, laporan transaksi, dan manajemen member.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-accent uppercase tracking-widest text-xs">
            Menghubungkan ke database pusat...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 mb-8">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                className="bg-black-deep/60 border border-gray-800 p-6 hover:border-red-primary hover:shadow-glow-red-subtle text-left transition-all duration-300 group relative angular-cut-sm"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-accent text-xs text-red-primary font-semibold tracking-wider block mb-1">
                  {b.code}
                </span>
                <h4 className="font-heading text-xl text-white group-hover:text-red-primary transition-colors">
                  {b.name.replace('Prabu Gym ', '')}
                </h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-3">Select Branch →</p>
              </button>
            ))}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={logout}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-primary font-accent transition-colors"
          >
            ← Keluar Dari Sistem
          </button>
        </div>
      </div>
    </div>
  );
}
