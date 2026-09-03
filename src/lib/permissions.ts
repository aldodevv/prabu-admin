import { ROLES, RoleName } from '@/constants/roles';
import { MENU_IDS } from '@/constants/ui';

export type Role = RoleName;

export interface RoleCapability {
  canSwitchBranch: boolean;
  isReadOnly: boolean;
  canAccessMenuStaff: boolean;
  canAccessMenuSettings: boolean;
  canDeleteMember: boolean;
  canDeleteTransaction: boolean;
  canManageBranches: boolean;
  canManageBranchTransfer: boolean;
  canManageProducts: boolean;
  description: string;
}

export const ROLE_CAPABILITIES: Record<Role, RoleCapability> = {
  [ROLES.ADMIN]: {
    canSwitchBranch: false,
    isReadOnly: false,
    canAccessMenuStaff: true,
    canAccessMenuSettings: true,
    canDeleteMember: true,
    canDeleteTransaction: true,
    canManageBranches: false,
    canManageBranchTransfer: false,
    canManageProducts: true,
    description: 'Admin Cabang: Akses operasional cabang sendiri (tidak bisa pindah cabang), kelola Data Staff, dan Pengaturan.',
  },
  [ROLES.CS]: {
    canSwitchBranch: false,
    isReadOnly: false,
    canAccessMenuStaff: false,
    canAccessMenuSettings: false,
    canDeleteMember: false,
    canDeleteTransaction: false,
    canManageBranches: false,
    canManageBranchTransfer: false,
    canManageProducts: false,
    description: 'Operational CRUD cabang sendiri, tanpa delete transaksi & anggota, tanpa data staff & pengaturan, tanpa pindah cabang & mutasi, read-only data barang/pembelian.',
  },
  [ROLES.OWNER]: {
    canSwitchBranch: true,
    isReadOnly: false,
    canAccessMenuStaff: true,
    canAccessMenuSettings: true,
    canDeleteMember: true,
    canDeleteTransaction: true,
    canManageBranches: false,
    canManageBranchTransfer: true,
    canManageProducts: true,
    description: 'Full CRUD operasional, Data Staff (kecuali developer), dan Pengaturan di semua cabang.',
  },
  [ROLES.DEVELOPER]: {
    canSwitchBranch: true,
    isReadOnly: false,
    canAccessMenuStaff: true,
    canAccessMenuSettings: true,
    canDeleteMember: true,
    canDeleteTransaction: true,
    canManageBranches: true,
    canManageBranchTransfer: true,
    canManageProducts: true,
    description: 'Super Admin: Akses penuh CRUD ke semua fitur, staff, pengaturan, dan kelola cabang.',
  },
};

export const normalizeRole = (role?: string): Role => {
  if (!role) return ROLES.CS;
  const lower = role.toLowerCase().trim();
  if (lower === 'karyawan' || lower === 'cs' || lower === 'staff') return ROLES.CS;
  if (lower in ROLE_CAPABILITIES) return lower as Role;
  return ROLES.CS;
};

/**
 * Helper terpusat untuk memeriksa izin akses berdasarkan Role di Frontend
 */
export const permissions = {
  canSwitchBranch: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canSwitchBranch ?? false,
  isReadOnly: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.isReadOnly ?? false,
  canViewRevenueAnalytics: (role?: string) => normalizeRole(role) !== ROLES.CS,
  canEditTransactionDate: (role?: string) => normalizeRole(role) !== ROLES.CS,
  canEditMemberNumber: (_role?: string) => true,
  canAccessMenu: (role?: string, menuId?: string) => {
    if (!role || !menuId) return false;
    const r = normalizeRole(role);
    if (menuId === MENU_IDS.STAFF) return ROLE_CAPABILITIES[r]?.canAccessMenuStaff ?? false;
    if (menuId === MENU_IDS.SETTINGS) return ROLE_CAPABILITIES[r]?.canAccessMenuSettings ?? false;
    return true;
  },
  canDeleteMember: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canDeleteMember ?? false,
  canDeleteTransaction: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canDeleteTransaction ?? false,
  canManageStaff: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canAccessMenuStaff ?? false,
  canManageSettings: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canAccessMenuSettings ?? false,
  canManageBranches: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canManageBranches ?? false,
  canManageBranchTransfer: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canManageBranchTransfer ?? false,
  canManageProducts: (role?: string) => ROLE_CAPABILITIES[normalizeRole(role)]?.canManageProducts ?? false,
  canModifyStaffWithRole: (currentRole?: string, targetRole?: string) => {
    const curr = normalizeRole(currentRole);
    const target = normalizeRole(targetRole);
    if (target === ROLES.DEVELOPER) return curr === ROLES.DEVELOPER;
    return curr === ROLES.DEVELOPER || curr === ROLES.OWNER || curr === ROLES.ADMIN;
  },
};
