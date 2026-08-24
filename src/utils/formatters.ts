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
  if (!packageName) return 1;
  const lower = packageName.toLowerCase();

  const pkg = PT_PACKAGES.find(p => lower.includes(p.name.toLowerCase()));
  if (pkg) return pkg.sessions;

  const match = lower.match(/(\d+)\s*sesi/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  if (lower.includes('12 sesi')) return 12;
  if (lower.includes('6 sesi')) return 6;
  if (lower.includes('3 sesi')) return 3;
  if (lower.includes('2 sesi')) return 2;
  if (lower.includes('1 sesi')) return 1;
  return 1;
}

/**
 * Format invoice transaction number to PRABU.[BRANCH].[YYMMDD].[SEQ] style
 */
export function formatInvoiceNumber(txNumber: any, dateStr?: string, branchNameOrCode: string = 'LIMO'): string {
  if (!txNumber) return '-';

  if (typeof txNumber === 'object' && txNumber !== null) {
    dateStr = dateStr || txNumber.transaction_date || txNumber.created_at;
    txNumber = txNumber.transaction_number || txNumber.invoice_number || txNumber.id || '-';
  }

  const strTx = String(txNumber);
  if (!strTx || strTx === 'undefined' || strTx === 'null') return '-';

  if (strTx.includes('-')) {
    const parts = strTx.split('-');
    const seq = parts[parts.length - 1];
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const yy = String(dateObj.getFullYear()).substring(2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const bCode = getBranchCode(branchNameOrCode);
    const shortSeq = String(Number(seq) || 1).padStart(3, '0');
    return `PRABU.${bCode}.${yy}${mm}${dd}.${shortSeq}`;
  }
  return strTx;
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
  if (!notes) return '1 Bulan (Daftar)';
  const n = notes.trim();

  // 1. PT Registration: "Pendaftaran Personal Trainer: PT 12 Sesi - Metode: ..."
  const ptMatch = n.match(/Pendaftaran Personal Trainer:\s*([^\-]+)/i) || n.match(/Paket PT:\s*([^\-]+)/i);
  if (ptMatch && ptMatch[1]) return ptMatch[1].trim();

  // 2. Member Registration / Renewal: "Pendaftaran Anggota: ... - 1 Bulan (Daftar)" or "Perpanjang Paket: 12 Bulan"
  const memMatch = n.match(/Perpanjang Paket:\s*([^\-]+)/i) ||
    n.match(/Pendaftaran Anggota:\s*([^\-]+)/i) ||
    n.match(/Paket:\s*([^\-,.]+)/i);
  if (memMatch && memMatch[1]) return memMatch[1].trim();

  // 3. Check for specific known package keywords
  for (const pkg of GYM_PACKAGES) {
    if (n.toLowerCase().includes(pkg.name.toLowerCase())) {
      return pkg.name;
    }
  }
  for (const pkg of PT_PACKAGES) {
    if (n.toLowerCase().includes(pkg.name.toLowerCase())) {
      return pkg.name;
    }
  }

  return '1 Bulan (Daftar)';
}

export interface PTDetails {
  packageName: string;
  sessionCount: number;
  trainerName: string;
}

/**
 * Extract PT package name, session count, and trainer name from transaction notes
 */
export function getPTDetailsFromNotes(notes: string = ''): PTDetails {
  const n = notes.trim();
  let packageName = 'PT 12 Sesi';
  let trainerName = 'Pelatih Prabu GYM';

  // 1. Extract package name
  const ptMatch = n.match(/Pendaftaran Personal Trainer:\s*([^\-]+)/i) ||
    n.match(/Paket PT:\s*([^\-]+)/i) ||
    n.match(/Paket Latihan:\s*([^\-]+)/i);
  if (ptMatch && ptMatch[1]) {
    packageName = ptMatch[1].trim();
  } else {
    for (const p of PT_PACKAGES) {
      if (n.toLowerCase().includes(p.name.toLowerCase())) {
        packageName = p.name;
        break;
      }
    }
  }

  // 2. Derive session count
  const sessionCount = getSessionCountFromPackage(packageName) || getSessionCountFromPackage(n) || 1;

  // 3. Extract trainer name if in notes
  const trMatch = n.match(/Trainer:\s*([^\-),]+)/i) || n.match(/Pelatih:\s*([^\-),]+)/i);
  if (trMatch && trMatch[1]) {
    trainerName = trMatch[1].trim();
  }

  return { packageName, sessionCount, trainerName };
}
