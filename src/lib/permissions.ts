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
  description: string;
}

export const ROLE_CAPABILITIES: Record<Role, RoleCapability> = {
  [ROLES.ADMIN]: {
    canSwitchBranch: true,
    isReadOnly: true,
    canAccessMenuStaff: false,
    canAccessMenuSettings: false,
    canDeleteMember: false,
    canDeleteTransaction: false,
    canManageBranches: false,
    description: 'Read-only semua cabang, bisa lihat data & detail, tidak ada data staff & pengaturan.',
  },
  [ROLES.KARYAWAN]: {
    canSwitchBranch: false,
    isReadOnly: false,
    canAccessMenuStaff: false,
    canAccessMenuSettings: false,
    canDeleteMember: false,
    canDeleteTransaction: false,
    canManageBranches: false,
    description: 'Operational CRUD cabang sendiri, tanpa delete transaksi & anggota, tanpa data staff & pengaturan, tanpa pindah cabang.',
  },
  [ROLES.OWNER]: {
    canSwitchBranch: true,
    isReadOnly: false,
    canAccessMenuStaff: true,
    canAccessMenuSettings: true,
    canDeleteMember: true,
    canDeleteTransaction: true,
    canManageBranches: false,
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
    description: 'Super Admin: Akses penuh CRUD ke semua fitur, staff, pengaturan, dan kelola cabang.',
  },
};

/**
 * Helper terpusat untuk memeriksa izin akses berdasarkan Role di Frontend
 */
export const permissions = {
  canSwitchBranch: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canSwitchBranch : false),
  isReadOnly: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.isReadOnly : false),
  canAccessMenu: (role?: string, menuId?: string) => {
    if (!role || !menuId || !(role in ROLE_CAPABILITIES)) return false;
    const r = role as Role;
    if (menuId === MENU_IDS.STAFF) return ROLE_CAPABILITIES[r].canAccessMenuStaff;
    if (menuId === MENU_IDS.SETTINGS) return ROLE_CAPABILITIES[r].canAccessMenuSettings;
    return true;
  },
  canDeleteMember: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canDeleteMember : false),
  canDeleteTransaction: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canDeleteTransaction : false),
  canManageStaff: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canAccessMenuStaff : false),
  canManageSettings: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canAccessMenuSettings : false),
  canManageBranches: (role?: string) => (role && role in ROLE_CAPABILITIES ? ROLE_CAPABILITIES[role as Role]?.canManageBranches : false),
  canModifyStaffWithRole: (currentRole?: string, targetRole?: string) => {
    if (targetRole === ROLES.DEVELOPER) return currentRole === ROLES.DEVELOPER;
    return currentRole === ROLES.DEVELOPER || currentRole === ROLES.OWNER;
  },
};
