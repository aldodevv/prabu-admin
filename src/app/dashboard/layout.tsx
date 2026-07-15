'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Home, 
  CreditCard, 
  ShoppingBag, 
  Users, 
  FileText, 
  ClipboardCheck, 
  Globe, 
  UserCheck, 
  ShieldAlert, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  Building2
} from 'lucide-react';

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
  const [isTransaksiOpen, setIsTransaksiOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (pathname.includes('/transactions')) {
      setIsTransaksiOpen(true);
    }
  }, [pathname]);

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-sans text-xs uppercase tracking-widest font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Memverifikasi kredensial sistem...</span>
        </div>
      </div>
    );
  }

  const activeBranch = branches.find((b) => b.id === activeBranchID);
  const currentBranchName = activeBranch ? activeBranch.name.replace('Prabu Gym ', '') : 'GROGOL';

  // Group menu items logically by domain
  const menuGroups = [
    {
      title: 'UTAMA',
      items: [
        { label: 'Beranda', href: '/dashboard', icon: Home },
      ]
    },
    {
      title: 'TRANSAKSI & PENJUALAN',
      items: [
        { label: 'Transaksi', href: '/dashboard/transactions', icon: CreditCard },
        { label: 'Transaksi Penjualan', href: '/dashboard/products', icon: ShoppingBag },
        { label: 'Laporan Fitnes', href: '/dashboard/reports', icon: FileText },
      ]
    },
    {
      title: 'DATA MASTER',
      items: [
        { label: 'Data Anggota', href: '/dashboard/members', icon: Users },
        { label: 'Data Pelatih / Trainer', href: '/dashboard/trainers', icon: Users },
        { label: 'Presensi Member', href: '/dashboard/checkins', icon: ClipboardCheck },
      ]
    },
    {
      title: 'KARYAWAN & SISTEM',
      items: user.role === 'owner' ? [
        { label: 'Kelola Karyawan', href: '/dashboard/employees', icon: UserCheck },
        { label: 'Audit Log Aktivitas', href: '/dashboard/activity-logs', icon: ShieldAlert },
      ] : []
    },
    {
      title: 'WEBSITE CMS',
      items: [
        { label: 'Content CMS', href: '/dashboard/content', icon: Globe },
      ]
    }
  ].filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-[#2A2F35] flex flex-col justify-between max-lg:hidden fixed h-screen z-40 select-none shadow-lg">
        <div className="flex flex-col h-[calc(100vh-10rem)]">
          {/* Brand header - solid red background matching screenshot */}
          <div className="h-16 bg-[#DC3545] flex items-center justify-between px-4 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl tracking-widest font-bold">
                PRABU GYM
              </span>
            </div>
            <Menu className="w-5 h-5 text-white opacity-80" />
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <h5 className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                  {group.title}
                </h5>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    if (item.label === 'Transaksi') {
                      const isSubActive = pathname.startsWith('/dashboard/transactions');
                      return (
                        <div key={item.label} className="space-y-1">
                          <button
                            onClick={() => setIsTransaksiOpen(!isTransaksiOpen)}
                            className={`w-full flex items-center justify-between px-4.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 rounded cursor-pointer ${
                              isSubActive
                                ? 'bg-[#1E2227] text-white font-bold border-l-4 border-[#DC3545]'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTransaksiOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isTransaksiOpen && (
                            <div className="pl-6 space-y-1.5 py-1">
                              <Link
                                href="/dashboard/transactions/scan-barcode"
                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                  pathname === '/dashboard/transactions/scan-barcode'
                                    ? 'text-white font-extrabold bg-[#1E2227] border-l-2 border-[#DC3545]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>🔍 Scan Barcode</span>
                              </Link>
                              <Link
                                href="/dashboard/transactions/member-registration"
                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                  pathname === '/dashboard/transactions/member-registration'
                                    ? 'text-white font-extrabold bg-[#1E2227] border-l-2 border-[#DC3545]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>👤 Pendaftaran Anggota</span>
                              </Link>
                              <Link
                                href="/dashboard/transactions/pt-registration"
                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                  pathname === '/dashboard/transactions/pt-registration'
                                    ? 'text-white font-extrabold bg-[#1E2227] border-l-2 border-[#DC3545]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>🏋️ Pendaftaran Latihan</span>
                              </Link>
                              <Link
                                href="/dashboard/transactions"
                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                  pathname === '/dashboard/transactions'
                                    ? 'text-white font-extrabold bg-[#1E2227] border-l-2 border-[#DC3545]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>🛒 Kasir (POS Retail)</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-4.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 rounded ${
                          isActive
                            ? 'bg-[#1E2227] text-white shadow-inner font-bold border-l-4 border-[#DC3545]'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50 space-y-3.5 bg-slate-900/10">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#DC3545] flex items-center justify-center text-sm font-bold text-white uppercase select-none shadow-sm">
              {user.full_name[0]}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{user.full_name}</h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {user.role}
              </span>
            </div>
          </div>

          {/* Daily checkin for Karyawan */}
          {user.role === 'karyawan' && (
            <button
              onClick={handleKaryawanCheckin}
              disabled={checkingIn}
              className={`w-full py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-center border transition-all rounded cursor-pointer ${
                checkinStatus
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
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
            className="w-full py-2.5 bg-slate-700/40 hover:bg-[#DC3545] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-all rounded cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOG OUT</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header - White Background matching screenshots */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMobileSidebar(!mobileSidebar)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 text-xl cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Branch display pill matching the red outline screenshot */}
            <div className="flex items-center gap-3">
              {user.role === 'owner' ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-red-500/80 rounded-full text-red-600 bg-red-50/30 text-xs font-bold uppercase tracking-wider select-none">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Club {currentBranchName}</span>
                  </div>
                  
                  <select
                    value={activeBranchID || ''}
                    onChange={(e) => selectBranch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 font-semibold text-[11px] uppercase tracking-wider py-1.5 px-2.5 rounded focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer transition-all"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#DC3545] rounded-full text-[#DC3545] bg-red-50/10 text-xs font-bold uppercase tracking-wider select-none">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Club {currentBranchName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: User Profile Dropdown and Date */}
          <div className="flex items-center gap-5">
            {/* Date Display */}
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-md:hidden">
              📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {/* User Dropdown Profile block */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-650 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer py-2 select-none"
              >
                <span>{user.role === 'karyawan' ? 'Kasir Prabu GYM' : user.full_name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {userDropdown && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-md py-1 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - light grey background */}
        <main className="flex-1 p-6 max-md:p-4 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        >
          <aside
            className="w-64 bg-[#2A2F35] h-full flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="h-14 flex items-center justify-between border-b border-slate-700/50 mb-4 text-white">
                <span className="font-heading text-2xl tracking-widest font-bold">
                  PRABU GYM
                </span>
                <button 
                  onClick={() => setMobileSidebar(false)} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4">
                {menuGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <h5 className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                      {group.title}
                    </h5>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        if (item.label === 'Transaksi') {
                          const isSubActive = pathname.startsWith('/dashboard/transactions');
                          return (
                            <div key={item.label} className="space-y-1">
                              <button
                                onClick={() => setIsTransaksiOpen(!isTransaksiOpen)}
                                className={`w-full flex items-center justify-between px-4.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all rounded cursor-pointer ${
                                  isSubActive
                                    ? 'bg-[#1E2227] text-white font-bold border-l-4 border-[#DC3545]'
                                    : 'text-slate-300 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTransaksiOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isTransaksiOpen && (
                                <div className="pl-6 space-y-1.5 py-1">
                                  <Link
                                    href="/dashboard/transactions/scan-barcode"
                                    onClick={() => setMobileSidebar(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                      pathname === '/dashboard/transactions/scan-barcode'
                                        ? 'text-white bg-[#1E2227] border-l-2 border-[#DC3545]'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span>🔍 Scan Barcode</span>
                                  </Link>
                                  <Link
                                    href="/dashboard/transactions/member-registration"
                                    onClick={() => setMobileSidebar(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                      pathname === '/dashboard/transactions/member-registration'
                                        ? 'text-white bg-[#1E2227] border-l-2 border-[#DC3545]'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span>👤 Pendaftaran Anggota</span>
                                  </Link>
                                  <Link
                                    href="/dashboard/transactions/pt-registration"
                                    onClick={() => setMobileSidebar(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                      pathname === '/dashboard/transactions/pt-registration'
                                        ? 'text-white bg-[#1E2227] border-l-2 border-[#DC3545]'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span>🏋️ Pendaftaran Latihan</span>
                                  </Link>
                                  <Link
                                    href="/dashboard/transactions"
                                    onClick={() => setMobileSidebar(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                      pathname === '/dashboard/transactions'
                                        ? 'text-white bg-[#1E2227] border-l-2 border-[#DC3545]'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span>🛒 Kasir (POS Retail)</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          );
                        }

                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileSidebar(false)}
                            className={`flex items-center gap-3 px-4.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all rounded ${
                              isActive 
                                ? 'bg-[#1E2227] text-white border-l-4 border-[#DC3545]' 
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <div className="border-t border-slate-700/50 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[#DC3545] flex items-center justify-center text-sm font-bold text-white uppercase">
                  {user.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{user.full_name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2 bg-slate-750 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-all rounded cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOG OUT</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
