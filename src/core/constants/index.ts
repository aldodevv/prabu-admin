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
 * Format number to Indonesian Rupiah currency string.
 */
export const formatIDR = (amount: number): string => {
  return `Rp. ${amount.toLocaleString('id-ID')}`;
};

/**
 * Format string date (e.g. "2026-07-16T10:30:00Z" or "2026-07-16") to "DD-MM-YYYY".
 */
export const formatDateLabel = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format string date to Long Indonesian Date Format (e.g. "12 Juli 2026").
 */
export const formatDateLong = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calculates membership end date (typically 1 month/days minus 1 day).
 */
export const calculateExpiryDate = (startDateStr: string, packageName?: string): string => {
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
};

/**
 * Derive session count from package name.
 */
export const getSessionCountFromPackage = (packageName: string = ''): number => {
  const pkg = PT_PACKAGES.find(p => packageName.includes(p.name));
  if (pkg) return pkg.sessions;

  // Fallback parsing logic
  if (packageName.includes('12 Sesi')) return 12;
  if (packageName.includes('6 Sesi')) return 6;
  if (packageName.includes('3 Sesi')) return 3;
  if (packageName.includes('2 Sesi')) return 2;
  if (packageName.includes('1 Sesi')) return 1;
  return 1;
};

/**
 * Parse payment method from notes
 */
export const getPaymentMethodFromNotes = (notes: string = ''): string => {
  const n = notes.toLowerCase();
  if (n.includes('tunai') || n.includes('cash')) return 'Tunai';
  if (n.includes('bca') || n.includes('transfer')) return 'BCA Transfer';
  if (n.includes('qris')) return 'QRIS';
  return 'Tunai';
};

/**
 * Parse membership package from notes
 */
export const getMembershipTypeFromNotes = (notes: string = ''): string => {
  const match = notes.match(/Paket:\s*([^\-,.]+)/i) || notes.match(/Pendaftaran Anggota:.*-\s*([^\-,.]+)/i);
  if (match && match[1]) return match[1].trim();
  return '1 Bulan (Daftar)';
};

/**
 * Route paths mapping
 */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SCAN_BARCODE: '/dashboard/transactions/scan-barcode',
  MEMBER_REGISTRATION: '/dashboard/transactions/member-registration',
  WORKOUT_REGISTRATION: '/dashboard/transactions/workout-registration',
  MEMBER_PAYMENT: '/dashboard/transactions/member-payment',
  TRAINER_SESSIONS: '/dashboard/transactions/trainer-sessions',
  CLASS_RECAP: '/dashboard/transactions/class-recap',
  CARD_REPLACEMENT: '/dashboard/transactions/card-replacement',
  SALES_CASH: '/dashboard/sales/cash',
  SALES_PURCHASE: '/dashboard/sales/purchase',
  SALES_ITEMS: '/dashboard/sales/items',
  SALES_DISTRIBUTORS: '/dashboard/sales/distributors',
  SALES_REPORTS: '/dashboard/sales/reports',
  SALES_HISTORY: '/dashboard/sales/history',
  MEMBERS_ONE_CLUB: '/dashboard/members/one-club',
  MEMBERS_ALL_CLUB: '/dashboard/members/all-club',
  MEMBERS_VISITS: '/dashboard/members/visits',
  REPORT_MEMBERS: '/dashboard/reports/members',
  REPORT_WORKOUTS: '/dashboard/reports/workouts',
  REPORT_PT_SESSIONS: '/dashboard/reports/pt-sessions',
  REPORT_CLASS_COMMISSIONS: '/dashboard/reports/class-commissions',
  REPORT_CARD_REPLACEMENTS: '/dashboard/reports/card-replacements',
  STAFF_CS: '/dashboard/staff/cs',
  STAFF_ADMIN: '/dashboard/staff/admin',
  STAFF_TRAINERS: '/dashboard/staff/trainers',
  SETTINGS_MEMBERSHIP_PACKAGES: '/dashboard/settings/membership-packages',
  SETTINGS_PT_PACKAGES: '/dashboard/settings/pt-packages',
  SETTINGS_CLASSES: '/dashboard/settings/classes',
};

/**
 * Navigation item representation
 */
export interface NavigationItem {
  label: string;
  href: string;
  iconName: string;
}

/**
 * Sidebar group representation
 */
export interface NavigationGroup {
  id: string;
  label: string;
  iconName: string;
  href?: string;
  items: NavigationItem[];
}

/**
 * Centralized modular navigation configuration
 */
export const NAVIGATION_MENU: NavigationGroup[] = [
  {
    id: 'beranda',
    label: 'Beranda',
    iconName: 'Home',
    href: ROUTES.DASHBOARD,
    items: []
  },
  {
    id: 'transaksi',
    label: 'Transaksi',
    iconName: 'LayoutGrid',
    items: [
      { label: 'Scan Barcode', href: ROUTES.SCAN_BARCODE, iconName: 'FileText' },
      { label: 'Pendaftaran Anggota', href: ROUTES.MEMBER_REGISTRATION, iconName: 'Users' },
      { label: 'Pendaftaran Latihan', href: ROUTES.WORKOUT_REGISTRATION, iconName: 'Users' },
      { label: 'Pembayaran Anggota', href: ROUTES.MEMBER_PAYMENT, iconName: 'CreditCard' },
      { label: 'Sesi Pelatih', href: ROUTES.TRAINER_SESSIONS, iconName: 'ClipboardCheck' },
      { label: 'Rekap Kelas', href: ROUTES.CLASS_RECAP, iconName: 'ClipboardCheck' },
      { label: 'Pergantian Cabang', href: ROUTES.CARD_REPLACEMENT, iconName: 'RefreshCw' },
    ]
  },
  {
    id: 'transaksi-penjualan',
    label: 'Transaksi Penjualan',
    iconName: 'LayoutGrid',
    items: [
      { label: 'Transaksi Tunai', href: ROUTES.SALES_CASH, iconName: 'CreditCard' },
      { label: 'Transaksi Pembelian', href: ROUTES.SALES_PURCHASE, iconName: 'ShoppingBag' },
      { label: 'Data Barang', href: ROUTES.SALES_ITEMS, iconName: 'FileText' },
      { label: 'Data Distributor', href: ROUTES.SALES_DISTRIBUTORS, iconName: 'Users' },
      { label: 'Laporan Penjualan', href: ROUTES.SALES_REPORTS, iconName: 'FileText' },
      { label: 'Riwayat Transaksi', href: ROUTES.SALES_HISTORY, iconName: 'ClipboardCheck' },
    ]
  },
  {
    id: 'data-anggota',
    label: 'Data Anggota',
    iconName: 'Folder',
    items: [
      { label: 'Anggota One Club', href: ROUTES.MEMBERS_ONE_CLUB, iconName: 'Users' },
      { label: 'Anggota All Club', href: ROUTES.MEMBERS_ALL_CLUB, iconName: 'Users' },
      { label: 'Kunjungan Anggota', href: ROUTES.MEMBERS_VISITS, iconName: 'ClipboardCheck' },
    ]
  },
  {
    id: 'laporan-fitnes',
    label: 'Laporan Fitnes',
    iconName: 'FileText',
    items: [
      { label: 'Laporan Anggota', href: ROUTES.REPORT_MEMBERS, iconName: 'FileText' },
      { label: 'Laporan Latihan', href: ROUTES.REPORT_WORKOUTS, iconName: 'FileText' },
      { label: 'Laporan Sesi PT', href: ROUTES.REPORT_PT_SESSIONS, iconName: 'FileText' },
      { label: 'Laporan Komisi Kelas', href: ROUTES.REPORT_CLASS_COMMISSIONS, iconName: 'FileText' },
      { label: 'Laporan Pergantian Cabang', href: ROUTES.REPORT_CARD_REPLACEMENTS, iconName: 'FileText' },
    ]
  },
  {
    id: 'data-staff',
    label: 'Data Staff',
    iconName: 'Folder',
    items: [
      { label: 'Data Customer Service', href: ROUTES.STAFF_CS, iconName: 'Users' },
      { label: 'Data Admin', href: ROUTES.STAFF_ADMIN, iconName: 'Users' },
      { label: 'Data Pelatih', href: ROUTES.STAFF_TRAINERS, iconName: 'Users' },
    ]
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    iconName: 'Settings',
    items: [
      { label: 'Paket Anggota', href: ROUTES.SETTINGS_MEMBERSHIP_PACKAGES, iconName: 'List' },
      { label: 'Paket Personal Trainer', href: ROUTES.SETTINGS_PT_PACKAGES, iconName: 'List' },
      { label: 'Daftar Nama Kelas', href: ROUTES.SETTINGS_CLASSES, iconName: 'List' },
    ]
  }
];


