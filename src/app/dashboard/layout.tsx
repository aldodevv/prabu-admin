'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CheckinState {
  action: string;
  is_late?: boolean;
  checkin?: {
    id: string;
    check_in_at: string;
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, activeBranchID, selectBranch, branches, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<any | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchCheckinStatus();
    }
  }, [user]);

  const fetchCheckinStatus = async () => {
    try {
      const res = await api.get<any>('/admin/my-checkin');
      if (res.success) {
        setCheckinStatus(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKaryawanCheckin = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post<CheckinState>('/admin/checkin', {});
      if (res.success && res.data) {
        await fetchCheckinStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black-deep flex items-center justify-center text-gray-500 font-accent uppercase tracking-widest text-xs">
        Memverifikasi kredensial sistem...
      </div>
    );
  }

  const currentBranchName = branches.find((b) => b.id === activeBranchID)?.name || 'Cabang';

  const menuItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: '📊' },
    { label: 'Manajemen Member', href: '/dashboard/members', icon: '👥' },
    { label: 'Presensi Member', href: '/dashboard/checkins', icon: '📋' },
    { label: 'Kasir & Transaksi', href: '/dashboard/transactions', icon: '🛒' },
    { label: 'Stok Produk', href: '/dashboard/products', icon: '📦' },
    { label: 'Content CMS', href: '/dashboard/content', icon: '📰' },
    { label: 'Laporan Masuk', href: '/dashboard/reports', icon: '📝' },
  ];

  // Owner only links
  if (user.role === 'owner') {
    menuItems.push(
      { label: 'Kelola Karyawan', href: '/dashboard/employees', icon: '👔' },
      { label: 'Audit Log Aktivitas', href: '/dashboard/activity-logs', icon: '🛡️' }
    );
  }

  return (
    <div className="min-h-screen bg-black-deep flex">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-black-card border-r border-gray-800 flex flex-col justify-between max-lg:hidden fixed h-screen z-40">
        <div>
          {/* Brand header */}
          <div className="h-20 flex items-center px-6 border-b border-gray-800 gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-primary animate-pulse-glow" />
            <h1 className="font-heading text-2xl tracking-wider text-white">
              PRABU<span className="text-red-primary">PANEL</span>
            </h1>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 font-accent text-xs uppercase tracking-widest transition-all duration-150 rounded ${
                    isActive
                      ? 'bg-red-primary text-white shadow-glow-red-subtle font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 hex-clip flex items-center justify-center text-sm font-semibold text-white">
              {user.full_name[0]}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">{user.full_name}</h4>
              <span className="text-[10px] text-red-primary uppercase tracking-wider block">
                {user.role}
              </span>
            </div>
          </div>

          {/* Daily checkin for Karyawan */}
          {user.role === 'karyawan' && (
            <button
              onClick={handleKaryawanCheckin}
              disabled={checkingIn}
              className={`w-full py-2 px-3 text-[10px] font-accent uppercase tracking-widest font-semibold text-center border transition-all ${
                checkinStatus
                  ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                  : 'bg-red-primary/10 border-red-primary/30 text-red-primary hover:bg-red-primary/20'
              }`}
            >
              {checkingIn
                ? 'MEMPROSES...'
                : checkinStatus
                ? 'PRESENSI: MASUK'
                : 'PRESENSI HARIAN'}
            </button>
          )}

          <button
            onClick={logout}
            className="w-full py-2.5 bg-gray-800/40 hover:bg-gray-800 text-gray-400 hover:text-white text-xs uppercase tracking-widest font-accent font-semibold transition-all rounded"
          >
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-black-card/40 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-8 max-md:px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMobileSidebar(!mobileSidebar)}
              className="lg:hidden p-2 text-white text-xl"
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div className="flex items-center gap-3">
              <span className="font-accent text-xs uppercase tracking-widest text-gray-500">OPERASI CABANG:</span>
              {user.role === 'owner' ? (
                <select
                  value={activeBranchID || ''}
                  onChange={(e) => selectBranch(e.target.value)}
                  className="bg-black-deep border border-gray-800 text-red-primary font-accent text-xs uppercase tracking-widest font-semibold py-1.5 px-3 focus:outline-none focus:border-red-primary cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-white font-accent text-xs uppercase tracking-widest font-semibold bg-gray-800/40 border border-gray-800 py-1.5 px-3">
                  {currentBranchName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400 font-accent uppercase tracking-wider max-md:hidden">
            📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 max-md:p-4 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 bg-black-deep/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        >
          <aside
            className="w-64 bg-black-card h-full flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="h-16 flex items-center justify-between border-b border-gray-800 mb-4">
                <h1 className="font-heading text-2xl tracking-wider text-white">
                  PRABU<span className="text-red-primary">PANEL</span>
                </h1>
                <button onClick={() => setMobileSidebar(false)} className="text-gray-400 hover:text-white text-xl">
                  ✕
                </button>
              </div>

              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebar(false)}
                      className={`flex items-center gap-3 px-4 py-3 font-accent text-xs uppercase tracking-widest transition-all rounded ${
                        isActive ? 'bg-red-primary text-white shadow-glow-red-subtle' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 hex-clip flex items-center justify-center text-sm font-semibold text-white">
                  {user.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{user.full_name}</h4>
                  <span className="text-[10px] text-red-primary uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2 bg-gray-800 text-gray-400 hover:text-white text-xs uppercase tracking-widest font-accent font-semibold transition-all rounded"
              >
                LOG OUT
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
