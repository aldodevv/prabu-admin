'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { PageHeader } from '@/components/core/PageHeader';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  List,
  Layers,
  Check
} from 'lucide-react';

interface MigrationResult {
  entity: string;
  limit_requested: number;
  processed_count: number;
  inserted_count: number;
  skipped_count: number;
  execution_time_ms: number;
  details: Record<string, number>;
}

const ENTITY_OPTIONS = [
  {
    id: 'members',
    label: 'Data Anggota (Members)',
    description: 'Termasuk data Cuti, Check-in, Pendaftaran PT, dan Transaksi Anggota terkait',
  },
  {
    id: 'transactions',
    label: 'Transaksi Penjualan Retail',
    description: 'Termasuk Detail Struk (transaction_items), Produk, dan Anggota terkait',
  },
  {
    id: 'products',
    label: 'Stok Produk Retail',
    description: 'Termasuk Riwayat Log Stok (product_stock_logs) dan Distributor terkait',
  },
  {
    id: 'checkins',
    label: 'Riwayat Kunjungan / Check-in',
    description: 'Termasuk Data Anggota terkait yang melakukan check-in',
  },
  {
    id: 'pt_registrations',
    label: 'Pendaftaran Personal Trainer',
    description: 'Termasuk Data Pelatih (Trainers) dan Anggota terkait',
  },
  {
    id: 'purchase_transactions',
    label: 'Transaksi Pembelian Stok Distributor',
    description: 'Termasuk Item Pembelian dan Distributor terkait',
  },
  {
    id: 'trainers',
    label: 'Data Pelatih Personal Trainer',
    description: 'Master Data Pelatih Gym',
  },
  {
    id: 'contents',
    label: 'Konten CMS (News & Promo)',
    description: 'Konten Berita, Pengumuman, & Bumper Banner',
  },
];

export default function MigrationPage() {
  const { branches } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<string>('members');
  const [limit, setLimit] = useState<number>(10);
  const [branchID, setBranchID] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleLimitChange = (val: number) => {
    if (isNaN(val)) return;
    if (val > 20) {
      setLimit(20);
    } else if (val < 1) {
      setLimit(1);
    } else {
      setLimit(val);
    }
  };

  const handleExecuteMigration = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResult(null);

    try {
      const res = await api.post<MigrationResult>('/admin/migration/execute', {
        entity: selectedEntity,
        limit: limit,
        branch_id: branchID === 'all' ? '' : branchID,
      });

      if (res.success && res.data) {
        setResult(res.data);
        setSuccessMsg(res.message || 'Migrasi data ke DB Pajak berhasil dijalankan.');
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
      {/* Existing Theme Standard Page Header */}
      <PageHeader
        title="Migrasi Data DB Main"
        description="Fitur Production Pemindahan Data Pilihan Ke URL_DB_MAIN"
      />

      {/* Existing Theme Alert Error */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Existing Theme Alert Success */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form Container Card with Standard Prabu Gym Header */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden w-full">
        {/* Banner Header (Matching Existing Form Pages) */}
        <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
          <Database className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider font-heading">
            Form Migrasi Data Khusus DB Main (URL_DB_MAIN)
          </span>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">

          {/* Form Field 1: Entity Select Cards */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider block">
              1. Pilih Data Yang Mau Dimigrasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {ENTITY_OPTIONS.map((opt) => {
                const isSelected = selectedEntity === opt.id;
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
                        <span className={`text-xs font-bold uppercase ${isSelected ? 'text-brand-cyan font-extrabold' : 'text-slate-800'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-brand-cyan shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Form Field 2: Max Limit Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider block">
                2. Batas Maksimal Input Data (Max 20) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={limit}
                  disabled={loading}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold text-slate-800 focus:outline-none focus:border-brand-cyan focus:bg-white transition-all disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Maks. 20 Data
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Dibatasi maksimal 20 data per proses untuk mencegah beban compute hours pada Neon DB.
              </p>
            </div>

            {/* Form Field 3: Branch Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider block">
                3. Filter Cabang Gym (Opsional)
              </label>
              <select
                value={branchID}
                disabled={loading}
                onChange={(e) => setBranchID(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded font-bold text-slate-800 focus:outline-none focus:border-brand-cyan focus:bg-white transition-all uppercase disabled:opacity-50"
              >
                <option value="all">Semua Cabang Gym (ALL)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 font-medium">
                Pilih cabang tertentu untuk memfilter data migrasi secara presisi.
              </p>
            </div>
          </div>

          {/* Info Note Protection Box */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3.5 flex items-start gap-3 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold uppercase text-amber-950">Proteksi Duplikasi (Unique Check)</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Data yang sudah berada di <code className="font-mono bg-amber-100 px-1 rounded text-amber-900 font-bold">URL_DB_MAIN</code> tidak akan diduplikasi (di-skip otomatis oleh server). Aman dieksekusi berkali-kali.
              </p>
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={handleExecuteMigration}
              className={`px-5 py-2.5 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-xs inline-flex items-center gap-2 ${
                loading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Migrasi...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Proses Migrasi ke DB Main</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Summary Breakdown Box */}
      {result && (
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden w-full space-y-4">
          <div className="bg-slate-800 px-5 py-3 text-white font-bold flex items-center gap-2 select-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm uppercase tracking-wider font-heading">
              Ringkasan Hasil Migrasi Data
            </span>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Diproses
                </span>
                <span className="text-base font-extrabold text-slate-800 mt-1 block font-mono">
                  {result.processed_count}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Berhasil Diinsert
                </span>
                <span className="text-base font-extrabold text-emerald-800 mt-1 block font-mono">
                  {result.inserted_count}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Di-skip (Duplikat)
                </span>
                <span className="text-base font-extrabold text-amber-800 mt-1 block font-mono">
                  {result.skipped_count}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Waktu Eksekusi
                </span>
                <span className="text-base font-extrabold text-slate-800 mt-1 block font-mono">
                  {result.execution_time_ms} ms
                </span>
              </div>
            </div>

            {/* Child Relational Details */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Detail Relasi Child Data Yang Ikut Termigrasi:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(result.details).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 font-mono text-[11px]">
                      <span className="font-bold text-slate-600">{key}</span>
                      <span className="font-extrabold text-brand-cyan">{val} data</span>
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
