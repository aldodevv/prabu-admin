/**
 * Centralized UI Labels, Column Headers, Actions & Messages Constants
 */

export const MENU_IDS = {
  HOME: 'beranda',
  TRANSACTIONS: 'transaksi',
  SALES: 'transaksi-penjualan',
  MEMBERS: 'data-anggota',
  REPORTS: 'laporan-fitnes',
  STAFF: 'data-staff',
  SETTINGS: 'pengaturan',
} as const;

export const ACTION_LABELS = {
  ADD: '+ Tambah',
  EDIT: 'Ubah',
  DELETE: 'Hapus',
  SAVE: 'Simpan',
  CANCEL: 'Batal',
  BACK: 'Kembali',
  PRINT: 'Cetak',
  DOCUMENT: 'Document',
  RESET: 'Reset',
  VIEW: 'Lihat Detail',
  EXPORT_EXCEL: 'Export Excel',
  SEARCH: 'Cari',
} as const;

export const COMMON_COLUMNS = {
  NO: 'No',
  ACTION: 'Aksi',
  NAME: 'Nama',
  DATE: 'Tanggal',
  STATUS: 'Status',
  NOTES: 'Keterangan',
  OFFICER: 'Petugas',
  MEMBER_NO: 'Nomor Anggota',
  MEMBER_NAME: 'Nama Anggota',
  PACKAGE: 'Paket Anggota',
  TRANSACTION_NO: 'Nomor Transaksi',
  TOTAL: 'Total Bayar',
  PAYMENT_METHOD: 'Jenis Transaksi',
} as const;

export const UI_MESSAGES = {
  LOADING: 'Memuat data...',
  EMPTY_DATA: 'Tidak ada data ditemukan.',
  ERROR_CONNECTION: 'Terjadi kesalahan koneksi ke server.',
  ERROR_FETCH: 'Gagal mengambil data.',
  SUCCESS_SAVE: 'Data berhasil disimpan!',
  SUCCESS_UPDATE: 'Data berhasil diperbarui!',
  SUCCESS_DELETE: 'Data berhasil dihapus!',
  CONFIRM_DELETE: (itemName: string) => `Apakah Anda yakin ingin menghapus "${itemName}"?`,
  CONFIRM_DEACTIVATE: (itemName: string) => `Apakah Anda yakin ingin menonaktifkan "${itemName}"?`,
} as const;
