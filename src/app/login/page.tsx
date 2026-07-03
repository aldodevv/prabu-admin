'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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

    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setErr(res.error || 'Login gagal. Periksa username dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-black-deep flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[100px] bg-red-primary" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-[120px] bg-red-dark" />

      <div className="w-full max-w-md bg-black-card/40 backdrop-blur-[30px] border border-gray-800 p-8 angular-cut relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-primary to-transparent" />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading text-white">PRABUGYM ADMIN</h2>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-accent">
            Integrated Management System
          </p>
        </div>

        {err && (
          <div className="mb-6 p-4 bg-red-primary/10 border-l-4 border-red-primary text-red-primary text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-2">
              Username Admin
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black-deep/60 border border-gray-800 focus:border-red-primary focus:outline-none text-white px-4 py-3 text-sm transition-all duration-300 font-body"
              placeholder="Masukkan username admin"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-widest font-accent mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black-deep/60 border border-gray-800 focus:border-red-primary focus:outline-none text-white px-4 py-3 text-sm transition-all duration-300 font-body"
              placeholder="Masukkan password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center font-accent font-semibold text-sm uppercase tracking-widest py-3.5 bg-gradient-to-br from-red-primary to-red-dark text-white btn-clip hover:from-red-glow hover:to-red-primary hover:shadow-glow-red transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'SINKRONISASI SISTEM...' : 'MASUK KE INTEGRATED PANEL'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500 font-accent uppercase tracking-wider">
          Prabu Gym Integrated System v1.0
        </div>
      </div>
    </div>
  );
}
