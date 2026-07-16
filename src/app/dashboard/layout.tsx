'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Home, 
  LayoutGrid, 
  Folder, 
  FileText,
  CreditCard,
  Users,
  ClipboardCheck,
  ShoppingBag,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Building2,
  ChevronRight
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
  const [userDropdown, setUserDropdown] = useState(false);
  
  // Compact sidebar active group dropdown state
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [mobileActiveGroup, setMobileActiveGroup] = useState<string | null>(null);

  // Group menu items logically by domain matching the reference images
  const menuConfig = [
    {
      id: 'beranda',
      label: 'Beranda',
      href: '/dashboard',
      icon: Home,
      items: []
    },
    {
      id: 'transaksi',
      label: 'Transaksi',
      icon: LayoutGrid,
      items: [
        { label: 'Scan Barcode', href: '/dashboard/transactions/scan-barcode', icon: FileText },
        { label: 'Pendaftaran Anggota', href: '/dashboard/transactions/member-registration', icon: Users },
        { label: 'Pendaftaran Latihan', href: '/dashboard/transactions/workout-registration', icon: Users },
        { label: 'Pembayaran Anggota', href: '/dashboard/transactions/member-payment', icon: CreditCard },
        { label: 'Sesi Pelatih', href: '/dashboard/transactions/trainer-sessions', icon: ClipboardCheck },
        { label: 'Rekap Kelas', href: '/dashboard/transactions/class-recap', icon: ClipboardCheck },
        { label: 'Pergantian Kartu', href: '/dashboard/transactions/card-replacement', icon: CreditCard },
      ]
    },
    {
      id: 'transaksi-penjualan',
      label: 'Transaksi Penjualan',
      icon: LayoutGrid,
      items: [
        { label: 'Transaksi Tunai', href: '/dashboard/sales/cash', icon: CreditCard },
        { label: 'Transaksi Pembelian', href: '/dashboard/sales/purchase', icon: ShoppingBag },
        { label: 'Data Barang', href: '/dashboard/sales/items', icon: FileText },
        { label: 'Data Distributor', href: '/dashboard/sales/distributors', icon: Users },
        { label: 'Laporan Penjualan', href: '/dashboard/sales/reports', icon: FileText },
        { label: 'Riwayat Transaksi', href: '/dashboard/sales/history', icon: ClipboardCheck },
      ]
    },
    {
      id: 'data-anggota',
      label: 'Data Anggota',
      icon: Folder,
      items: [
        { label: 'Anggota One Club', href: '/dashboard/members/one-club', icon: Users },
        { label: 'Anggota All Club', href: '/dashboard/members/all-club', icon: Users },
        { label: 'Kunjungan Anggota', href: '/dashboard/members/visits', icon: ClipboardCheck },
      ]
    },
    {
      id: 'laporan-fitnes',
      label: 'Laporan Fitnes',
      icon: FileText,
      items: [
        { label: 'Laporan Anggota', href: '/dashboard/reports/members', icon: FileText },
        { label: 'Laporan Latihan', href: '/dashboard/reports/workouts', icon: FileText },
        { label: 'Laporan Sesi PT', href: '/dashboard/reports/pt-sessions', icon: FileText },
        { label: 'Laporan Komisi Kelas', href: '/dashboard/reports/class-commissions', icon: FileText },
        { label: 'Laporan Pergantian Kartu', href: '/dashboard/reports/card-replacements', icon: FileText },
      ]
    }
  ];

  // Auto-expand menu group on page load/navigation based on pathname
  useEffect(() => {
    const matched = menuConfig.find(group => 
      group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    );
    if (matched) {
      setActiveGroup(matched.id);
      setMobileActiveGroup(matched.id);
    } else {
      setActiveGroup(null);
      setMobileActiveGroup(null);
    }
  }, [pathname]);

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-sans text-xs uppercase tracking-widest font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Memverifikasi kredensial sistem...</span>
        </div>
      </div>
    );
  }

  const hasSubmenu = activeGroup && activeGroup !== 'beranda';
  const activeGroupConfig = menuConfig.find(g => g.id === activeGroup);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans text-slate-800">
      
      {/* 1. Main Sidebar - Compact Desktop (110px width) */}
      <aside className="w-[110px] bg-[#343A40] flex flex-col justify-between max-lg:hidden fixed h-screen z-40 select-none shadow-md">
        <div className="flex flex-col h-full">
          {/* Prabu Gym Brand Banner */}
          <div className="h-16 bg-[#DC3545] flex items-center justify-center text-white flex-shrink-0">
            <span className="font-heading text-base tracking-widest font-extrabold text-center leading-tight">
              PRABU
            </span>
          </div>

          {/* Navigation Icon List */}
          <nav className="flex-1 flex flex-col pt-4 overflow-y-auto">
            {menuConfig.map((group) => {
              const Icon = group.icon;
              const isBeranda = group.id === 'beranda';
              const isGroupActive = isBeranda 
                ? pathname === '/dashboard' 
                : activeGroup === group.id;

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    if (isBeranda) {
                      router.push('/dashboard');
                    } else {
                      setActiveGroup(activeGroup === group.id ? null : group.id);
                    }
                  }}
                  className={`w-full flex flex-col items-center justify-center py-5 text-center transition-all duration-150 relative cursor-pointer border-b border-slate-700/10 ${
                    isGroupActive
                      ? 'bg-[#2A2F35] text-white'
                      : 'text-slate-300 hover:bg-[#2A2F35]/50 hover:text-white'
                  }`}
                >
                  {/* Arrow Indicator pointing right to sub-menu */}
                  {isGroupActive && !isBeranda && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#2A2F35] z-50" />
                  )}
                  
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-tight text-center px-1 block break-words max-w-[95%] font-accent">
                    {group.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 2. Secondary Sidebar Drawer - Desktop (Sub-items) */}
      {hasSubmenu && activeGroupConfig && (
        <aside className="w-64 bg-[#2A2F35] text-slate-300 fixed left-[110px] top-0 bottom-0 z-30 flex flex-col shadow-lg border-r border-slate-800 max-lg:hidden animate-fade-in select-none">
          {/* Top header to align with primary header */}
          <div className="h-16 border-b border-slate-800 flex items-center px-5 flex-shrink-0 bg-slate-900/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-accent">
              Menu {activeGroupConfig.label}
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {activeGroupConfig.items.map((item) => {
              const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const SubIcon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all rounded ${
                    isItemActive
                      ? 'bg-[#DC3545] text-white font-extrabold shadow-sm'
                      : 'hover:bg-slate-700/40 text-slate-350 hover:text-white'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User check-in and logout controls inside secondary drawer bottom */}
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/10">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded bg-[#DC3545] flex items-center justify-center text-xs font-bold text-white uppercase select-none">
                {user.full_name[0]}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{user.full_name}</h4>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  {user.role}
                </span>
              </div>
            </div>

            {user.role === 'karyawan' && (
              <button
                onClick={handleKaryawanCheckin}
                disabled={checkingIn}
                className={`w-full py-2 px-3 text-[9px] font-bold uppercase tracking-widest text-center border transition-all rounded cursor-pointer ${
                  checkinStatus
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {checkingIn ? '...' : checkinStatus ? 'PRESENSI: MASUK' : 'PRESENSI HARIAN'}
              </button>
            )}

            <button
              onClick={logout}
              className="w-full py-2 bg-slate-700/40 hover:bg-[#DC3545] text-slate-350 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              <span>LOG OUT</span>
            </button>
          </div>
        </aside>
      )}

      {/* 3. Main Content Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          hasSubmenu ? 'lg:pl-[366px]' : 'lg:pl-[110px]'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileSidebar(true)}
            className="p-1 text-slate-500 hover:text-slate-800 lg:hidden cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-6 ml-auto">
            {/* Branch Selector Dropdown */}
            {branches.length > 0 && (
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-650 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-[#DC3545]" />
                  <span className="uppercase tracking-wider">Cabang:</span>
                  <select
                    value={activeBranchID || ''}
                    onChange={(e) => selectBranch(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer uppercase text-slate-800 font-extrabold pr-1"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name.replace('Prabu Gym ', '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2.5 focus:outline-none cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-sm uppercase group-hover:border-[#DC3545] transition-all">
                  {user.full_name[0]}
                </div>
                <div className="text-left max-sm:hidden">
                  <h4 className="text-xs font-bold text-slate-700 leading-none group-hover:text-slate-900">{user.full_name}</h4>
                  <span className="text-[10px] font-accent text-slate-400 font-bold uppercase tracking-wider">{user.role}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-250 rounded-lg shadow-xl py-1.5 z-50 text-xs animate-fade-in font-body">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-700 truncate">{user.username}</p>
                    <p className="text-slate-400 text-[10px] truncate">{user.email || '-'}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-650 hover:text-red-700 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-8 max-md:p-4">
          {children}
        </main>
      </div>

      {/* 4. Mobile Navigation Drawer (Floating Overlay Drawer) */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSidebar(false)}
          />

          {/* Drawer content panel */}
          <aside className="relative w-72 max-w-[85vw] bg-[#343A40] flex flex-col justify-between h-full p-6 text-slate-300 shadow-2xl z-50 animate-slide-right select-none">
            <div className="space-y-6 flex-1 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                <span className="font-heading text-lg font-bold text-white tracking-widest">PRABU GYM</span>
                <button
                  onClick={() => setMobileSidebar(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2 flex-1">
                {menuConfig.map((group) => {
                  const Icon = group.icon;
                  const isBeranda = group.id === 'beranda';
                  const isMobileActive = isBeranda 
                    ? pathname === '/dashboard' 
                    : mobileActiveGroup === group.id;

                  if (isBeranda) {
                    return (
                      <Link
                        key={group.id}
                        href="/dashboard"
                        onClick={() => setMobileSidebar(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all rounded ${
                          pathname === '/dashboard'
                            ? 'bg-[#DC3545] text-white border-l-4 border-white'
                            : 'text-slate-300 hover:bg-[#2A2F35]/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{group.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        onClick={() => setMobileActiveGroup(mobileActiveGroup === group.id ? null : group.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all rounded cursor-pointer ${
                          isMobileActive
                            ? 'bg-[#2A2F35] text-white border-l-4 border-[#DC3545]'
                            : 'text-slate-300 hover:bg-[#2A2F35]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{group.label}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileActiveGroup === group.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {mobileActiveGroup === group.id && (
                        <div className="pl-6 space-y-1 py-1">
                          {group.items.map((item) => {
                            const isSubActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const SubIcon = item.icon;
                            return (
                              <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setMobileSidebar(false)}
                                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${
                                  isSubActive
                                    ? 'text-white bg-[#DC3545]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-700/50 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#DC3545] flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{user.full_name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileSidebar(false);
                  logout();
                }}
                className="w-full py-2 bg-slate-700/40 hover:bg-[#DC3545] text-slate-350 hover:text-white text-xs font-bold uppercase tracking-widest transition-all rounded cursor-pointer flex items-center justify-center gap-2"
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
