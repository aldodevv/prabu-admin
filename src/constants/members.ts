/**
 * Centralized Member & Gender Constants
 */

export const MEMBER_STATUS = {
  ALL: 'Semua',
  ACTIVE: 'Aktif',
  EXPIRED: 'Expired',
  INACTIVE: 'Nonaktif',
} as const;

export const MEMBER_STATUS_OPTIONS = [
  MEMBER_STATUS.ALL,
  MEMBER_STATUS.ACTIVE,
  MEMBER_STATUS.EXPIRED,
  MEMBER_STATUS.INACTIVE,
] as const;

export const GENDERS = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
} as const;

export const GENDER_OPTIONS = [
  GENDERS.MALE,
  GENDERS.FEMALE,
] as const;

export type MemberStatus = typeof MEMBER_STATUS[keyof typeof MEMBER_STATUS];
export type Gender = typeof GENDERS[keyof typeof GENDERS];
