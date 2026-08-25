import { BRANCH_ADDRESSES, SHORT_BRANCH_CODES, BRANCH_NAMES, DEFAULT_BRANCH_CODE } from '@/constants/branch';

export { BRANCH_ADDRESSES, SHORT_BRANCH_CODES, BRANCH_NAMES } from '@/constants/branch';

/**
 * Returns formatted address for a given branch code or branch name
 */
export function getBranchAddress(branchCodeOrName?: string): string {
  if (!branchCodeOrName) return BRANCH_ADDRESSES.GROGOL;
  const upper = branchCodeOrName.toUpperCase();
  if (upper.includes('PITARA') || upper.includes('PTR') || upper.includes('PANCORAN')) {
    return BRANCH_ADDRESSES.PITARA;
  }
  if (upper.includes('LIMO') || upper.includes('LMO')) {
    return BRANCH_ADDRESSES.LIMO;
  }
  return BRANCH_ADDRESSES.GROGOL;
}

/**
 * Returns formatted display name for a given branch code or branch name (e.g. "PRABU GYM Grogol")
 */
export function getBranchDisplayName(branchCodeOrName?: string): string {
  if (!branchCodeOrName) return BRANCH_NAMES.GROGOL;
  if (branchCodeOrName.startsWith('PRABU GYM ')) return branchCodeOrName;
  const upper = branchCodeOrName.toUpperCase();
  if (upper.includes('PITARA') || upper.includes('PTR') || upper.includes('PANCORAN')) {
    return BRANCH_NAMES.PITARA;
  }
  if (upper.includes('LIMO') || upper.includes('LMO')) {
    return BRANCH_NAMES.LIMO;
  }
  return BRANCH_NAMES.GROGOL;
}

/**
 * Map branch name or string to short branch code (GGL, LMO, PTR)
 */
export function getBranchCode(branchName?: string): string {
  if (!branchName) return SHORT_BRANCH_CODES[DEFAULT_BRANCH_CODE];
  const upper = branchName.toUpperCase();
  if (upper.includes('GROGOL') || upper.includes('GGL')) return SHORT_BRANCH_CODES.GROGOL;
  if (upper.includes('LIMO') || upper.includes('LMO')) return SHORT_BRANCH_CODES.LIMO;
  if (upper.includes('PITARA') || upper.includes('PTR') || upper.includes('PANCORAN')) return SHORT_BRANCH_CODES.PITARA;
  return SHORT_BRANCH_CODES[DEFAULT_BRANCH_CODE];
}
