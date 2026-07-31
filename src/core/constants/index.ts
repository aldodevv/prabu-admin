export {
  formatIDR,
  formatDateLabel,
  formatDateLong,
  formatInvoiceNumber,
  getPaymentMethodFromNotes,
  getMembershipTypeFromNotes,
  getBranchAddress,
  getBranchCode,
  calculateExpiryDate,
  getSessionCountFromPackage,
  GYM_PACKAGES,
  PT_PACKAGES,
  BRANCH_ADDRESSES,
  toDataURL,
} from '@/utils';

export type { GymPackage, PTPackage } from '@/utils';

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
  MEMBERS_LEAVES: '/dashboard/members/leaves',
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
  SETTINGS_CMS: '/dashboard/settings/cms',
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
      { label: 'Data Anggota', href: ROUTES.MEMBERS_ONE_CLUB, iconName: 'Users' },
      { label: 'Cuti Anggota', href: ROUTES.MEMBERS_LEAVES, iconName: 'PauseCircle' },
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
      { label: 'Manajemen CMS (News & Promo)', href: ROUTES.SETTINGS_CMS, iconName: 'FileText' },
    ]
  }
];
