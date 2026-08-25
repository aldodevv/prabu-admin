/**
 * Centralized Branch Constants
 */

export const BRANCH_CODES = {
  GROGOL: 'GROGOL',
  LIMO: 'LIMO',
  PITARA: 'PITARA',
} as const;

export type BranchCodeKey = keyof typeof BRANCH_CODES;

export const SHORT_BRANCH_CODES: Record<string, string> = {
  GROGOL: 'GGL',
  LIMO: 'LMO',
  PITARA: 'PTR',
};

export const DEFAULT_BRANCH_CODE = 'LIMO';

export const BRANCH_ADDRESSES: Record<string, string> = {
  GROGOL: 'JALAN GROGOL RAYA NO. 43, GROGOL-DEPOK',
  LIMO: 'JALAN LIMO RAYA NO. 95, LIMO-DEPOK',
  PITARA: 'JALAN PITARA RAYA NO. 89, PITARA-DEPOK',
};

export const BRANCH_NAMES: Record<string, string> = {
  GROGOL: 'PRABU GYM Grogol',
  LIMO: 'PRABU GYM Limo',
  PITARA: 'PRABU GYM Pitara',
};
