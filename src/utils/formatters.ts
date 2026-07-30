import { getBranchCode } from './branch';

export interface GymPackage {
  name: string;
  price: number;
  days: number;
}

export interface PTPackage {
  name: string;
  sessions: number;
  price: number;
}

export const GYM_PACKAGES: GymPackage[] = [
  { name: '1 bulan', price: 250000, days: 30 },
  { name: '1 bulan (daftar)', price: 200000, days: 30 },
  { name: '1 bulan (perpanjang)', price: 250000, days: 30 },
  { name: '3 bulan', price: 600000, days: 90 },
  { name: '3 bulan - Promo Januari', price: 600000, days: 90 },
  { name: '3 bulan (daftar) - Promo Januari', price: 555000, days: 90 },
  { name: '6 bulan', price: 1200000, days: 180 },
  { name: '6 bulan - Promo Januari', price: 1250000, days: 180 },
  { name: '6 bulan (daftar) - Promo Januari', price: 1100000, days: 180 },
  { name: '12 bulan', price: 2200000, days: 365 },
  { name: '12 bulan - Promo Januari', price: 2270000, days: 365 },
  { name: '12 bulan (daftar)', price: 1180000, days: 365 }
];

export const PT_PACKAGES: PTPackage[] = [
  { name: 'Bonus 1 Sesi', sessions: 1, price: 0 },
  { name: 'Bonus 2 Sesi', sessions: 2, price: 0 },
  { name: 'PT 1 Sesi', sessions: 1, price: 150000 },
  { name: 'PT 3 Sesi', sessions: 3, price: 400000 },
  { name: 'PT 6 Sesi', sessions: 6, price: 750000 },
  { name: 'PT 12 Sesi', sessions: 12, price: 1200000 }
];

/**
 * Format number to Indonesian Rupiah string (e.g. "Rp 250.000")
 */
export function formatIDR(amount: number): string {
  return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
}

/**
 * Format date string (e.g. "2026-07-29T10:30:00Z") to "DD-MM-YYYY"
 */
export function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format string date to Long Indonesian Date Format (e.g. "29 Juli 2026")
 */
export function formatDateLong(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculates membership end date (typically 1 month/days minus 1 day).
 */
export function calculateExpiryDate(startDateStr: string, packageName?: string): string {
  if (!startDateStr) return '';
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return '';

  let days = 30; // default to 30 days
  if (packageName) {
    const gymPkg = GYM_PACKAGES.find(p => p.name === packageName);
    if (gymPkg) {
      days = gymPkg.days;
    }
  }

  d.setDate(d.getDate() + days - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Derive session count from package name.
 */
export function getSessionCountFromPackage(packageName: string = ''): number {
  const pkg = PT_PACKAGES.find(p => packageName.includes(p.name));
  if (pkg) return pkg.sessions;

  if (packageName.includes('12 Sesi')) return 12;
  if (packageName.includes('6 Sesi')) return 6;
  if (packageName.includes('3 Sesi')) return 3;
  if (packageName.includes('2 Sesi')) return 2;
  if (packageName.includes('1 Sesi')) return 1;
  return 1;
}

/**
 * Format invoice transaction number to PRABU.[BRANCH].[YYMMDD].[SEQ] style
 */
export function formatInvoiceNumber(txNumber: string, dateStr?: string, branchNameOrCode: string = 'LIMO'): string {
  if (!txNumber) return '-';
  if (txNumber.includes('-')) {
    const parts = txNumber.split('-');
    const seq = parts[parts.length - 1];
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const yy = String(dateObj.getFullYear()).substring(2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const bCode = getBranchCode(branchNameOrCode);
    const shortSeq = String(Number(seq) || 1).padStart(3, '0');
    return `PRABU.${bCode}.${yy}${mm}${dd}.${shortSeq}`;
  }
  return txNumber;
}

/**
 * Parse payment method from transaction notes
 */
export function getPaymentMethodFromNotes(notes: string = ''): string {
  const n = notes.toLowerCase();
  if (n.includes('tunai') || n.includes('cash')) return 'Tunai';
  if (n.includes('bca') || n.includes('transfer')) return 'BCA Transfer';
  if (n.includes('qris')) return 'QRIS';
  return 'Tunai';
}

/**
 * Parse membership package name from transaction notes
 */
export function getMembershipTypeFromNotes(notes: string = ''): string {
  const match = notes.match(/Paket:\s*([^\-,.]+)/i) || notes.match(/Pendaftaran Anggota:.*-\s*([^\-,.]+)/i);
  if (match && match[1]) return match[1].trim();
  return '1 Bulan (Daftar)';
}
