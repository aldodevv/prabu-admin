/**
 * Centralized Role Constants & Display Labels
 */

export const ROLES = {
  DEVELOPER: 'developer',
  OWNER: 'owner',
  ADMIN: 'admin',
  KARYAWAN: 'karyawan',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleName, string> = {
  developer: 'Developer (Super Admin)',
  owner: 'Owner',
  admin: 'Admin (Read-Only)',
  karyawan: 'Customer Service (CS)',
};

export const ROLE_BADGE_COLORS: Record<RoleName, string> = {
  developer: 'bg-purple-100 text-purple-800 border-purple-300',
  owner: 'bg-amber-100 text-amber-800 border-amber-300',
  admin: 'bg-blue-100 text-blue-800 border-blue-300',
  karyawan: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};
