'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Check, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErr('Username dan password wajib diisi');
      return;
    }

    setErr('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (!res.success) {
        setErr(res.error || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch (error: any) {
      setErr('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-stretch font-sans">
      {/* Left Pane - Gym Imagery (Visible on Large Screens) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center items-center justify-center p-12 overflow-hidden"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        
        {/* Glow decorative rings */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-red-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-lg text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-red-light">
            ⚡ Integrated Management System
          </div>
          <h1 className="text-5xl font-heading tracking-wide leading-tight text-white drop-shadow-md">
            PRABUGYM <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-primary to-orange-400">
              INTEGRATED PANEL
            </span>
          </h1>
          <p className="text-slate-200 text-lg font-light leading-relaxed">
            Kelola operasional gym, pantau presensi kehadiran member, dan kelola laporan keuangan secara cepat dan terintegrasi di satu dashboard panel.
          </p>
          <div className="pt-8 border-t border-white/10 flex gap-8 text-xs text-slate-300 uppercase tracking-widest font-semibold">
            <div>
              <p className="text-white text-lg font-heading">3+</p>
              <p className="text-slate-400">Cabang Aktif</p>
            </div>
            <div>
              <p className="text-white text-lg font-heading">Real-Time</p>
              <p className="text-slate-400">Statistik Kehadiran</p>
            </div>
            <div>
              <p className="text-white text-lg font-heading">Secure</p>
              <p className="text-slate-400">Enkripsi Data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - White Login Panel */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-8 sm:p-16 md:p-20 relative">
        <div />

        <div className="w-full max-w-md mx-auto my-auto space-y-8">
          {/* PRABU GYM Stylized SVG Logo */}
          <div className="text-center flex flex-col items-center select-none">
            <svg 
              className="w-48 h-auto mb-2" 
              viewBox="0 0 500 240" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Crown */}
              <path 
                d="M170 55 L200 85 L250 45 L300 85 L330 55 L320 100 L180 100 Z" 
                fill="#DC3545" 
              />
              {/* Barbell Left Disk */}
              <rect x="70" y="110" width="15" height="50" rx="4" fill="#1E293B" />
              <rect x="90" y="100" width="15" height="70" rx="4" fill="#1E293B" />
              <rect x="110" y="90" width="18" height="90" rx="6" fill="#1E293B" />
              
              {/* Barbell Shaft */}
              <rect x="128" y="130" width="244" height="10" fill="#1E293B" />

              {/* Barbell Right Disk */}
              <rect x="372" y="90" width="18" height="90" rx="6" fill="#1E293B" />
              <rect x="395" y="100" width="15" height="70" rx="4" fill="#1E293B" />
              <rect x="415" y="110" width="15" height="50" rx="4" fill="#1E293B" />

              {/* Fist Grabbing Center */}
              <path 
                d="M210 145 C210 120, 290 120, 290 145 C290 160, 210 160, 210 145 Z" 
                fill="#DC3545" 
              />
              <path 
                d="M215 140 C215 130, 230 130, 230 140 M230 140 C230 130, 245 130, 245 140 M245 140 C245 130, 260 130, 260 140 M260 140 C260 130, 275 130, 275 140" 
                stroke="#FFFFFF" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Text */}
              <text 
                x="250" 
                y="205" 
                textAnchor="middle" 
                fontFamily="Impact, sans-serif" 
                fontSize="48" 
                fill="#1E293B" 
                letterSpacing="2"
              >
                PRABU
              </text>
              <text 
                x="250" 
                y="235" 
                textAnchor="middle" 
                fontFamily="sans-serif" 
                fontWeight="900" 
                fontSize="22" 
                fill="#DC3545" 
                letterSpacing="4"
              >
                GYM
              </text>
            </svg>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mt-1">
              Integrated Management System
            </p>
          </div>

          {err && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2.5 animate-fadeIn">
              <span className="text-base mt-0.5">⚠️</span>
              <span className="font-medium">{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
                Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#E9F0FD] border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 px-10 py-3 text-sm rounded transition-all duration-150"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#E9F0FD] border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 px-10 py-3 text-sm rounded transition-all duration-150"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 font-semibold text-sm uppercase tracking-wider py-3 bg-[#007BFF] hover:bg-blue-600 text-white rounded transition-all duration-150 shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SINKRONISASI SISTEM...</span>
                </>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 stroke-[3px]" />
                  <span>Masuk Akun</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400 font-semibold mt-8">
          2021 © Ampaba Development
        </div>
      </div>
    </div>
  );
}
