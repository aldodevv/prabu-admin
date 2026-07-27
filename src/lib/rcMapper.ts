/**
 * Comprehensive Response Code (RC) Dictionary & Translator for Prabu System
 * Categorized into:
 * 1. HUMAN / VALIDATION ERROR (VAL01 - VAL05, HUM06 - HUM07)
 * 2. AUTHENTICATION & SECURITY ERROR (AUTH01 - AUTH02, SEC01 - SEC02)
 * 3. CLOUD & NETWORK ERROR (NET01 - NET02, CLD01 - CLD03)
 * 4. SYSTEM & DATABASE ERROR (SYS01 - SYS99)
 */

export interface RCDetail {
  code: string;
  category: 'HUMAN_ERROR' | 'AUTH_ERROR' | 'CLOUD_ERROR' | 'SYSTEM_ERROR';
  categoryLabel: string;
  title: string;
  message: string;
  actionAdvice: string;
}

export const RC_DICTIONARY: Record<string, RCDetail> = {
  // ==========================================
  // 1. HUMAN / VALIDATION ERROR (Kesalahan Admin / Form Input)
  // ==========================================
  '00': {
    code: '00',
    category: 'HUMAN_ERROR',
    categoryLabel: 'SUKSES',
    title: 'Sukses',
    message: 'Transaksi / permintaan berhasil diproses.',
    actionAdvice: 'Tidak ada tindakan yang diperlukan.',
  },
  'VAL01': {
    code: 'VAL01',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (INPUT TEKS)',
    title: 'Karakter Teks Melebihi Batas',
    message: 'Teks input yang dimasukkan terlalu panjang melebihi kapasitas kolom database.',
    actionAdvice: 'Persingkat karakter nama, email, alamat, atau nomor HP sesuai aturan.',
  },
  'VAL02': {
    code: 'VAL02',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (DATA DUPLIKAT)',
    title: 'Data Sudah Terdaftar (Duplikat)',
    message: 'Data unik (nama, nomor HP, email, atau kode barang) sudah pernah terdaftar di sistem.',
    actionAdvice: 'Gunakan nama, kode, email, atau nomor HP lain yang belum pernah digunakan.',
  },
  'VAL03': {
    code: 'VAL03',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (DATA REFERENSI)',
    title: 'Data Referensi Tidak Ditemukan',
    message: 'Data relasi terkait (ID Cabang, Member, Pelatih, atau Produk) tidak ada di database.',
    actionAdvice: 'Pastikan data cabang, member, atau produk yang dipilih dalam keadaan aktif.',
  },
  'VAL04': {
    code: 'VAL04',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (FORMAT INPUT)',
    title: 'Format Input Tidak Valid',
    message: 'Penulisan angka, format email, tanggal, atau karakter khusus yang diisi tidak sesuai.',
    actionAdvice: 'Periksa kembali penulisan nomor HP (angka saja), email (user@domain.com), atau tanggal.',
  },
  'VAL05': {
    code: 'VAL05',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (KOLOM WAKTU / KOSONG)',
    title: 'Kolom Wajib Belum Diisi',
    message: 'Terdapat kolom wajib (bertanda *) yang masih belum diisi.',
    actionAdvice: 'Lengkapi seluruh kolom bernota wajib sebelum mengklik tombol simpan.',
  },
  'HUM06': {
    code: 'HUM06',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (STOK HABIS)',
    title: 'Stok Barang / Produk Tidak Cukup',
    message: 'Jumlah unit produk yang dipesan melebihi sisa stok yang tersedia di toko.',
    actionAdvice: 'Kurangi jumlah pesanan atau lakukan restok barang melalui transaksi pembelian.',
  },
  'HUM07': {
    code: 'HUM07',
    category: 'HUMAN_ERROR',
    categoryLabel: 'HUMAN ERROR (PEMBAYARAN)',
    title: 'Nominal Pembayaran Kurang',
    message: 'Uang pembayaran yang dimasukkan kurang dari total tagihan transaksi.',
    actionAdvice: 'Masukkan jumlah uang bayar yang pas atau lebih besar dari total tagihan.',
  },

  // ==========================================
  // 2. AUTHENTICATION & SECURITY ERROR (Keamanan / Akses)
  // ==========================================
  'AUTH01': {
    code: 'AUTH01',
    category: 'AUTH_ERROR',
    categoryLabel: 'SECURITY ERROR (AUTENTIKASI)',
    title: 'Sesi Login Berakhir / Gagal Autentikasi',
    message: 'Kredensial username/password salah atau masa berlaku sesi token Anda sudah habis.',
    actionAdvice: 'Silakan lakukan login ulang untuk memperbarui token akun Admin Anda.',
  },
  'AUTH02': {
    code: 'AUTH02',
    category: 'AUTH_ERROR',
    categoryLabel: 'SECURITY ERROR (HAK AKSES)',
    title: 'Hak Akses Tidak Mencukupi',
    message: 'Role akun Anda (karyawan/kasir) tidak diizinkan membuka atau mengubah fitur ini.',
    actionAdvice: 'Hubungi Super Admin / Owner jika Anda memerlukan akses ke fitur ini.',
  },
  'SEC01': {
    code: 'SEC01',
    category: 'AUTH_ERROR',
    categoryLabel: 'SECURITY ERROR (SIGNATURE)',
    title: 'Verifikasi Keamanan Gagal',
    message: 'Token keamanan atau signature header request tidak valid / terindikasi manipulasi.',
    actionAdvice: 'Refresh browser Anda dan pastikan waktu jam perangkat Anda sudah akurat.',
  },
  'SEC02': {
    code: 'SEC02',
    category: 'AUTH_ERROR',
    categoryLabel: 'SECURITY ERROR (RATE LIMIT)',
    title: 'Terlalu Banyak Permintaan',
    message: 'Permintaan request dikirimkan terlalu cepat dalam waktu singkat (Anti-Spam).',
    actionAdvice: 'Tunggu beberapa detik sebelum mengklik tombol simpan kembali.',
  },

  // ==========================================
  // 3. CLOUD & NETWORK ERROR (Koneksi / Storage Cloud)
  // ==========================================
  'NET01': {
    code: 'NET01',
    category: 'CLOUD_ERROR',
    categoryLabel: 'NETWORK ERROR (KONEKSI TERPUTUS)',
    title: 'Koneksi Internet Terputus',
    message: 'Perangkat Anda tidak terhubung ke jaringan internet (Offline).',
    actionAdvice: 'Periksa koneksi Wi-Fi atau paket data internet Anda.',
  },
  'NET02': {
    code: 'NET02',
    category: 'CLOUD_ERROR',
    categoryLabel: 'NETWORK ERROR (TIMEOUT)',
    title: 'Koneksi Server Timeout',
    message: 'Server backend membutuhkan waktu terlalu lama untuk merespon permintaan.',
    actionAdvice: 'Coba tekan kembali tombol aksi atau periksa kestabilan jaringan internet.',
  },
  'CLD01': {
    code: 'CLD01',
    category: 'CLOUD_ERROR',
    categoryLabel: 'CLOUD STORAGE ERROR',
    title: 'Gagal Upload Berkas ke Cloud CDN',
    message: 'Gagal menyimpan foto/gambar ke layanan media penyimpanan cloud storage.',
    actionAdvice: 'Coba gunakan foto dengan ukuran lebih kecil atau format JPG/PNG yang valid.',
  },
  'CLD02': {
    code: 'CLD02',
    category: 'CLOUD_ERROR',
    categoryLabel: 'CLOUD PAYLOAD ERROR',
    title: 'Ukuran Gambar Terlalu Besar',
    message: 'Ukuran foto yang diunggah melebihi batas maksimal 5 Megabytes (5MB).',
    actionAdvice: 'Kompres atau gunakan file gambar yang berukuran di bawah 5MB.',
  },
  'CLD03': {
    code: 'CLD03',
    category: 'CLOUD_ERROR',
    categoryLabel: 'THIRD-PARTY CLOUD DOWN',
    title: 'Layanan Cloud Pihak Ketiga Offline',
    message: 'Layanan eksternal (CDN/Payment Gateway/WA Bot) sedang mengalami kendala.',
    actionAdvice: 'Silakan tunggu beberapa saat atau pilih metode pembayaran/proses manual.',
  },

  // ==========================================
  // 4. SYSTEM & DATABASE ERROR (Kesalahan Sistem Server)
  // ==========================================
  'SYS01': {
    code: 'SYS01',
    category: 'SYSTEM_ERROR',
    categoryLabel: 'SYSTEM ERROR (DATABASE TERPUTUS)',
    title: 'Koneksi Database Terputus',
    message: 'Server backend kehilangan koneksi ke database Postgres Neon.',
    actionAdvice: 'Hubungi Tim IT / Server Administrator untuk memeriksa status server DB.',
  },
  'SYS02': {
    code: 'SYS02',
    category: 'SYSTEM_ERROR',
    categoryLabel: 'SYSTEM ERROR (TRANSAKSI DB)',
    title: 'Gagal Memproses Transaksi Database',
    message: 'Terjadi kegagalan commit/lock pada transaksi database backend.',
    actionAdvice: 'Coba ulangi transaksi. Jika tetap berlanjut, hubungi tim IT.',
  },
  'SYS03': {
    code: 'SYS03',
    category: 'SYSTEM_ERROR',
    categoryLabel: 'SYSTEM ERROR (STORAGE FULL)',
    title: 'Kapasitas Server Penuh',
    message: 'Penyimpanan server backend/database telah mencapai batas kuota penuh.',
    actionAdvice: 'Segera laporkan ke Super Admin / Tim IT untuk pembersihan log/storage.',
  },
  'SYS04': {
    code: 'SYS04',
    category: 'SYSTEM_ERROR',
    categoryLabel: 'SYSTEM ERROR (NOT FOUND)',
    title: 'Data Tidak Ditemukan',
    message: 'Data yang dicari tidak ada atau sudah dihapus oleh admin lain.',
    actionAdvice: 'Refresh halaman daftar data untuk melihat pembaruan terbaru.',
  },
  'SYS99': {
    code: 'SYS99',
    category: 'SYSTEM_ERROR',
    categoryLabel: 'SYSTEM ERROR (FATAL SERVER)',
    title: 'Kesalahan Server Internal (500)',
    message: 'Terjadi kesalahan sistem internal yang tidak terduga pada server.',
    actionAdvice: 'Catat waktu kejadian dan hubungi Tim Developer/IT support.',
  },
};

/**
 * Formats a clean Indonesian translation for Admin UI with Category Badges
 * Example:
 * [HUMAN ERROR | RC VAL01] Karakter Teks Melebihi Batas: Teks input yang dimasukkan terlalu panjang... (Saran: Persingkat karakter...)
 */
export function translateRC(rc?: string, backendMessage?: string): string {
  if (!rc) {
    return backendMessage || 'Terjadi kesalahan pada sistem.';
  }

  const detail = RC_DICTIONARY[rc];
  if (detail) {
    return `[${detail.categoryLabel} | RC ${rc}] ${detail.title}: ${detail.message} 👉 (Saran: ${detail.actionAdvice})`;
  }

  return `[SYSTEM ERROR | RC ${rc}] ${backendMessage || 'Terjadi kesalahan pada sistem backend.'}`;
}

export function getRCDetail(rc?: string): RCDetail | null {
  if (!rc) return null;
  return RC_DICTIONARY[rc] || null;
}
