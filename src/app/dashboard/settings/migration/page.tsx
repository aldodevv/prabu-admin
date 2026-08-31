'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { PageHeader } from '@/components/core/PageHeader';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Check,
  Building2,
  Users,
  CreditCard,
  Package,
  QrCode,
  Dumbbell,
  ShoppingBag,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';

interface MigrationResult {
  entity: string;
  branch_id: string;
  limit_requested: number;
  total_in_source: number;
  already_in_target: number;
  remaining_unmigrated: number;
  processed_count: number;
  inserted_count: number;
  skipped_count: number;
  execution_time_ms: number;
  details: Record<string, number>;
}

const ENTITY_OPTIONS = [
  {
    id: 'members',
    label: 'Data Anggota & Riwayat Lengkap',
    icon: Users,
    description: 'Termasuk Transaksi Pembayaran Paket, Detail Struk Kasir, Check-in, Cuti, dan Pendaftaran PT terkait.',
  },
  {
    id: 'transactions',
    label: 'Transaksi Penjualan Kasir (POS / Retail)',
    icon: CreditCard,
    description: 'Termasuk Detail Item Struk (transaction_items), Produk Retail, dan Anggota terkait.',
  },
  {
    id: 'purchase_transactions',
    label: 'Transaksi Pembelian Stok Distributor',
    icon: ShoppingBag,
    description: 'Termasuk Detail Item Pembelian, Data Distributor, dan Stok Produk terkait.',
  },
  {
    id: 'products',
    label: 'Stok Produk Retail & Distributor',
    icon: Package,
    description: 'Termasuk Riwayat Log Perubahan Stok (product_stock_logs) dan Distributor terkait.',
  },
  {
    id: 'checkins',
    label: 'Riwayat Kunjungan / Check-in',
    icon: QrCode,
    description: 'Termasuk Data Anggota terkait yang melakukan check-in barcode.',
  },
  {
    id: 'pt_registrations',
    label: 'Pendaftaran Personal Trainer',
    icon: Dumbbell,
    description: 'Termasuk Data Pelatih (Trainers) dan Anggota terkait.',
  },
];

const DETAIL_LABELS: Record<string, string> = {
  transactions_migrated: 'Transaksi Pembayaran Kasir / Member',
  transaction_items_migrated: 'Detail Item Struk Transaksi',
  checkins_migrated: 'Riwayat Kunjungan / Check-in Barcode',
  member_leaves_migrated: 'Riwayat Cuti Anggota',
  pt_registrations_migrated: 'Pendaftaran Personal Trainer',
  product_stock_logs_migrated: 'Riwayat Log Stok Barang',
  purchase_transaction_items_migrated: 'Detail Item Pembelian Distributor',
};

export default function MigrationPage() {
  const { branches, activeBranchID } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<string>('members');
  const [limit, setLimit] = useState<number>(10);
  const [branchID, setBranchID] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  // Default to active branch or first branch in list
  useEffect(() => {
    if (!branchID && branches.length > 0) {
      if (activeBranchID) {
        setBranchID(activeBranchID);
      } else {
        setBranchID(branches[0].id);
      }
    }
  }, [branches, activeBranchID, branchID]);

  const handleLimitPreset = (val: number) => {
    setLimit(val);
  };

  const handleLimitChange = (val: number) => {
    if (isNaN(val)) return;
    if (val > 100) {
      setLimit(100);
    } else if (val < 1) {
      setLimit(1);
    } else {
      setLimit(val);
    }
  };

  const handleExecuteMigration = async () => {
    if (!branchID) {
      setErrorMsg('Pilih cabang gym tujuan terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResult(null);

    try {
      const res = await api.post<MigrationResult>('/admin/migration/execute', {
        entity: selectedEntity,
        limit: limit,
        branch_id: branchID,
      });

      if (res.success && res.data) {
        setResult(res.data);
        const branchName = branches.find((b) => b.id === branchID)?.name || 'Cabang Terpilih';
        setSuccessMsg(
          `Migrasi ${res.data.inserted_count} data untuk ${branchName} berhasil diselesaikan.`
        );
      } else {
        setErrorMsg(res.error || 'Gagal mengeksekusi migrasi data.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-body pb-12">
      {/* Standard Header */}
      <PageHeader
        title="Migrasi Data ke DB Pajak"
        description="Pemindahan Data Bertahap & Presisi Per Cabang Ke Database Pajak (URL_DB_MAIN)"
      />

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Alert Success */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden w-full">
        {/* Banner Header */}
        <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
          <Database className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider font-heading">
            Form Pemindahan Data Per Cabang (Smart Queue & Cascading)
          </span>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">

          {/* Form Field 1: Branch Selection (Strict Per-Branch) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>1. Pilih Cabang Gym Spesifik <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {branches.map((b) => {
                const isSelected = branchID === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setBranchID(b.id)}
                    className={`p-3.5 rounded border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-cyan bg-cyan-50/50 shadow-xs ring-2 ring-brand-cyan text-brand-cyan font-bold'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-cyan' : 'text-slate-400'}`} />
                      <span className="text-xs uppercase">{b.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-cyan shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Data hanya akan diambil dan dipindahkan khusus untuk cabang yang dipilih (tidak mencampur aduk cabang).
            </p>
          </div>

          {/* Form Field 2: Entity Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-cyan" />
              <span>2. Pilih Jenis Data Yang Ingin Dimigrasi <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {ENTITY_OPTIONS.map((opt) => {
                const isSelected = selectedEntity === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedEntity(opt.id)}
                    className={`p-3.5 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-cyan bg-cyan-50/40 shadow-xs ring-1 ring-brand-cyan'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-brand-cyan' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold uppercase ${isSelected ? 'text-brand-cyan font-extrabold' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-cyan shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Field 3: Batch Limit Input & Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-cyan" />
              <span>3. Jumlah Data Per Batch Eksekusi (Maksimal 100) <span className="text-red-500">*</span></span>
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[5, 10, 20, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={loading}
                  onClick={() => handleLimitPreset(preset)}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                    limit === preset
                      ? 'bg-brand-cyan text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {preset} Data
                </button>
              ))}
              <div className="relative inline-flex items-center ml-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  disabled={loading}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="w-28 bg-slate-50 border border-slate-300 p-1.5 rounded font-bold font-mono text-slate-800 text-center focus:outline-none focus:border-brand-cyan focus:bg-white transition-all disabled:opacity-50"
                />
                <span className="ml-2 text-slate-500 font-medium">Custom</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Sistem akan otomatis mengambil urutan data berikutnya yang <strong>belum pernah dimigrasi</strong> secara sekuensial.
            </p>
          </div>

          {/* Info Note Protection Box */}
          <div className="bg-cyan-50/60 border border-cyan-200 rounded p-4 flex items-start gap-3 text-cyan-950 text-xs">
            <ShieldAlert className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold uppercase text-brand-cyan">Sistem Antrean Bebas Duplikasi & Cascading Otomatis</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Setiap kali Anda menekan tombol migrasi, sistem membandingkan database sumber dan target, lalu mengambil data berikutnya yang belum ada di DB Pajak. Semua riwayat transaksi dan data anak yang bersangkutan akan otomatis ikut tersinkronisasi.
              </p>
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={loading || !branchID}
              onClick={handleExecuteMigration}
              className={`px-6 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-xs inline-flex items-center gap-2 ${
                loading || !branchID ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Migrasi Data...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Jalankan Migrasi ke DB Pajak</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Summary Breakdown Box */}
      {result && (
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden w-full space-y-4">
          <div className="bg-slate-900 px-5 py-3 text-white font-bold flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm uppercase tracking-wider font-heading">
                Hasil Migrasi Data Cabang
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-300 font-normal">
              Waktu: {result.execution_time_ms} ms
            </span>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* 4 Cards Grid Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Data di Sumber (Prod)
                </span>
                <span className="text-lg font-extrabold text-slate-800 mt-1 block font-mono">
                  {result.total_in_source}
                </span>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider block">
                  Sudah Ada di DB Pajak
                </span>
                <span className="text-lg font-extrabold text-brand-cyan mt-1 block font-mono">
                  {result.already_in_target}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Berhasil Dimigrasi Sekarang
                </span>
                <span className="text-lg font-extrabold text-emerald-800 mt-1 block font-mono">
                  +{result.inserted_count}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Sisa Belum Termigrasi
                </span>
                <span className="text-lg font-extrabold text-amber-800 mt-1 block font-mono">
                  {result.remaining_unmigrated}
                </span>
              </div>
            </div>

            {/* Child Relational Details */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Rincian Relasi Data Anak Yang Ikut Termigrasi:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(result.details).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded border border-slate-200 font-mono text-[11px]"
                    >
                      <span className="font-bold text-slate-700">
                        {DETAIL_LABELS[key] || key}
                      </span>
                      <span className="font-extrabold text-brand-cyan bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                        {val} data
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
