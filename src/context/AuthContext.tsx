'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface AdminUser {
  id: string;
  branch_id: string;
  branch_name?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string; // "owner", "karyawan"
  is_active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

interface AuthContextType {
  user: AdminUser | null;
  activeBranchID: string | null;
  branches: Branch[];
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  selectBranch: (branchID: string) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeBranchID, setActiveBranchID] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('prabu_admin_token');
    const storedBranch = localStorage.getItem('prabu_admin_branch_id');
    
    if (storedToken) {
      if (storedBranch) {
        setActiveBranchID(storedBranch);
      }
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      // First, get branches (available to logged-in admins)
      const branchRes = await api.get<Branch[]>('/admin/branches');
      if (branchRes.success && branchRes.data) {
        setBranches(branchRes.data);
      }

      // Next, get active admin session info. 
      // We can use a simple get list or config. Since we don't have a direct /profile for admin, 
      // we can deduce or decode token claims, or call an active checkin endpoint to verify token validity.
      // Alternatively, let's verify token validity by loading dashboard summary (cheap request).
      const verifyRes = await api.get<any>('/admin/dashboard/summary');
      if (!verifyRes.success && verifyRes.error === 'Token tidak valid atau expired') {
        logout();
        return;
      }

      // Restore user object from localstorage
      const storedUser = localStorage.getItem('prabu_admin_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // If karyawan, force their assigned branch ID
        if (parsedUser.role === 'karyawan') {
          handleSelectBranch(parsedUser.branch_id);
        }
      }
    } catch (err) {
      console.error('Failed to restore admin session:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: AdminUser }>('/auth/admin/login', {
        username,
        password,
      });

      if (res.success && res.data) {
        const loggedUser = res.data.user;
        localStorage.setItem('prabu_admin_token', res.data.token);
        localStorage.setItem('prabu_admin_user', JSON.stringify(loggedUser));
        document.cookie = `prabu_admin_token=${res.data.token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        
        setUser(loggedUser);

        // Fetch branches
        const branchRes = await api.get<Branch[]>('/admin/branches');
        if (branchRes.success && branchRes.data) {
          setBranches(branchRes.data);
        }

        if (loggedUser.role === 'karyawan') {
          handleSelectBranch(loggedUser.branch_id);
          router.push('/dashboard');
        } else {
          // Owner needs to select a branch first
          router.push('/branch-select');
        }
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Login gagal' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan jaringan' };
    }
  };

  const logout = () => {
    localStorage.removeItem('prabu_admin_token');
    localStorage.removeItem('prabu_admin_user');
    localStorage.removeItem('prabu_admin_branch_id');
    document.cookie = 'prabu_admin_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'prabu_admin_branch_id=; path=/; max-age=0; SameSite=Lax';
    
    setUser(null);
    setActiveBranchID(null);
    setBranches([]);
    router.push('/login');
  };

  const handleSelectBranch = (branchID: string) => {
    localStorage.setItem('prabu_admin_branch_id', branchID);
    document.cookie = `prabu_admin_branch_id=${branchID}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
    setActiveBranchID(branchID);
  };

  const refreshUserData = async () => {
    await fetchAdminData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBranchID,
        branches,
        loading,
        login,
        logout,
        selectBranch: handleSelectBranch,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
