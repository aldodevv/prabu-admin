'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { DataTable, Column } from '@/components/core/DataTable';
import { Edit, Trash2, Search, Save, Upload } from 'lucide-react';
import { HubCardItem } from './types';

interface HubTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  hubStep: 'list' | 'create' | 'edit';
  setHubStep: (step: 'list' | 'create' | 'edit') => void;
  createTrigger?: number; // counter to trigger create form from parent header
}

export const HubTab: React.FC<HubTabProps> = ({
  onSuccess,
  onError,
  hubStep,
  setHubStep,
  createTrigger,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hubItems, setHubItems] = useState<HubCardItem[]>([]);
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [deletingHubId, setDeletingHubId] = useState<string | null>(null);
  const [hubSearch, setHubSearch] = useState('');
  const [hubUploadNote, setHubUploadNote] = useState<string | null>(null);

  // Hub Form Fields
  const [hubTitle, setHubTitle] = useState('');
  const [hubCategory, setHubCategory] = useState<'downloads' | 'videos' | 'exclusive' | 'merchandise'>('downloads');
  const [hubBadge, setHubBadge] = useState('E-Book PDF');
  const [hubPrice, setHubPrice] = useState('GRATIS');
  const [hubOriginalPrice, setHubOriginalPrice] = useState('');
  const [hubIsFree, setHubIsFree] = useState(true);
  const [hubIsMemberOnly, setHubIsMemberOnly] = useState(false);
  const [hubDescription, setHubDescription] = useState('');
  const [hubImage, setHubImage] = useState('/images/background1.jpeg');
  const [hubActionType, setHubActionType] = useState<'download' | 'video' | 'whatsapp' | 'claim'>('download');
  const [hubFormat, setHubFormat] = useState('PDF • 4.2 MB');
  const [hubRating, setHubRating] = useState('⭐ 5.0');
  const [hubStats, setHubStats] = useState('100+ Diunduh');
  const [hubHighlightsStr, setHubHighlightsStr] = useState('Panduan Full\nLengkap Set & Reps\nSiap Cetak');
  const [hubIsActive, setHubIsActive] = useState(true);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchHubItems();
  }, []);

  // Listen to parent header create trigger
  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreateHub();
    }
  }, [createTrigger]);

  const fetchHubItems = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await api.get<HubCardItem[]>('/admin/hub-items');
      if (res.success && res.data) {
        setHubItems(res.data);
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memuat data Hub Items');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetSetter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setHubUploadNote('Mengunggah...');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      if (res.success && res.data?.url) {
        targetSetter(res.data.url);
        setHubUploadNote('✓ Cover Uploaded');
      } else {
        setHubUploadNote('❌ Upload Gagal');
      }
    } catch (err: any) {
      setHubUploadNote('❌ Upload Gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenCreateHub = () => {
    setEditingHubId(null);
    setHubTitle('');
    setHubCategory('downloads');
    setHubBadge('E-Book PDF');
    setHubPrice('GRATIS');
    setHubOriginalPrice('');
    setHubIsFree(true);
    setHubIsMemberOnly(false);
    setHubDescription('');
    setHubImage('/images/background1.jpeg');
    setHubActionType('download');
    setHubFormat('PDF • 4.2 MB');
    setHubRating('⭐ 5.0');
    setHubStats('100+ Diunduh');
    setHubHighlightsStr('Panduan Full\nLengkap Set & Reps\nSiap Cetak');
    setHubIsActive(true);
    setHubStep('create');
  };

  const handleOpenEditHub = (item: HubCardItem) => {
    setEditingHubId(item.id);
    setHubTitle(item.title);
    setHubCategory(item.category);
    setHubBadge(item.badge);
    setHubPrice(item.price);
    setHubOriginalPrice(item.originalPrice || '');
    setHubIsFree(item.isFree);
    setHubIsMemberOnly(item.isMemberOnly);
    setHubDescription(item.description);
    setHubImage(item.image);
    setHubActionType(item.actionType);
    setHubFormat(item.format || '');
    setHubRating(item.rating || '⭐ 5.0');
    setHubStats(item.stats || '100+ Diunduh');
    setHubHighlightsStr(Array.isArray(item.highlights) ? item.highlights.join('\n') : '');
    setHubIsActive(item.isActive);
    setHubStep('edit');
  };

  const handleSaveHubItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubTitle.trim()) {
      onError('Judul Hub Card wajib diisi');
      return;
    }

    setLoading(true);

    const highlights = hubHighlightsStr
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    let categoryLabel = 'Downloads';
    if (hubCategory === 'videos') categoryLabel = 'Videos';
    if (hubCategory === 'exclusive') categoryLabel = 'Member Exclusive';
    if (hubCategory === 'merchandise') categoryLabel = 'Merchandise';

    const payload = {
      title: hubTitle,
      category: hubCategory,
      categoryLabel,
      badge: hubBadge,
      price: hubPrice,
      originalPrice: hubOriginalPrice || null,
      isFree: hubIsFree,
      isMemberOnly: hubIsMemberOnly,
      description: hubDescription,
      image: hubImage,
      actionType: hubActionType,
      format: hubFormat,
      rating: hubRating,
      stats: hubStats,
      highlights,
      isActive: hubIsActive,
    };

    try {
      if (hubStep === 'create') {
        await api.post('/admin/hub-items', payload);
        onSuccess('Hub Card baru berhasil ditambahkan!');
      } else {
        await api.put(`/admin/hub-items/${editingHubId}`, payload);
        onSuccess('Hub Card berhasil diperbarui!');
      }
      setHubStep('list');
      fetchHubItems();
    } catch (err: any) {
      onError(err.message || 'Gagal menyimpan item Hub Card');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHubItem = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/admin/hub-items/${id}`);
      onSuccess('Hub Card berhasil dihapus!');
      setDeletingHubId(null);
      fetchHubItems();
    } catch (err: any) {
      onError(err.message || 'Gagal menghapus item Hub Card');
    } finally {
      setLoading(false);
    }
  };

  const filteredHubItems = hubItems.filter(
    (item) =>
      item.title.toLowerCase().includes(hubSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(hubSearch.toLowerCase())
  );

  const hubColumns: Column<HubCardItem>[] = [
    {
      key: 'title',
      header: 'Item / Judul',
      render: (item) => (
        <div className="flex items-center gap-3">
          <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
          <div>
            <span className="font-bold text-white text-sm block">{item.title}</span>
            <span className="text-slate-400 text-xs line-clamp-1">{item.description}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/10 text-red-400 border border-red-500/20">
          {item.categoryLabel}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Harga Tampilan',
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-xs">{item.price}</span>
          {item.originalPrice && (
            <span className="block text-[10px] text-slate-500 line-through">{item.originalPrice}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${item.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
        >
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEditHub(item)}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit Hub Card"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeletingHubId(item.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Hapus Hub Card"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {hubStep === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari Hub Item..."
                value={hubSearch}
                onChange={(e) => setHubSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <DataTable
            data={filteredHubItems}
            columns={hubColumns}
            loading={loading}
            emptyMessage="Belum ada Hub Card produk"
          />
        </div>
      ) : (
        /* CREATE / EDIT FORM FOR HUB CARD */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full space-y-0">
          <div className="bg-brand-cyan px-5 py-3.5 text-white font-bold flex items-center justify-between select-none">
            <h3 className="text-sm font-extrabold uppercase tracking-wider font-heading text-white">
              {hubStep === 'create' ? 'Tambah Hub Card Baru' : 'Edit Item Hub Card'}
            </h3>
            <button
              onClick={() => setHubStep('list')}
              className="text-xs font-bold uppercase text-slate-700 bg-white hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              Kembali ke Daftar
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSaveHubItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul Item</label>
                <input
                  type="text"
                  required
                  value={hubTitle}
                  onChange={(e) => setHubTitle(e.target.value)}
                  placeholder="mis. Prabu Starter Workout Program 30 Hari"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori</label>
                  <select
                    value={hubCategory}
                    onChange={(e) => setHubCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="downloads">Downloads (E-Book & Sheet)</option>
                    <option value="videos">Videos (Tutorial & Guide)</option>
                    <option value="exclusive">Member Exclusive</option>
                    <option value="merchandise">Merchandise (Apparel & Gear)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={hubBadge}
                    onChange={(e) => setHubBadge(e.target.value)}
                    placeholder="mis. E-Book PDF / Masterclass / Apparel Resmi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Tampilan</label>
                  <input
                    type="text"
                    value={hubPrice}
                    onChange={(e) => setHubPrice(e.target.value)}
                    placeholder="mis. GRATIS / MEMBER FREE / Rp189.000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Asli (Coret)</label>
                  <input
                    type="text"
                    value={hubOriginalPrice}
                    onChange={(e) => setHubOriginalPrice(e.target.value)}
                    placeholder="mis. Rp229.000 (opsional)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Format / Ket Ukuran</label>
                <input
                  type="text"
                  value={hubFormat}
                  onChange={(e) => setHubFormat(e.target.value)}
                  placeholder="mis. PDF • 4.2 MB / Video HD • 24 Min / Ukuran S - XXL"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi Lengkap</label>
                <textarea
                  rows={3}
                  required
                  value={hubDescription}
                  onChange={(e) => setHubDescription(e.target.value)}
                  placeholder="Jelaskan detail produk/materi..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Highlights (1 per baris)</label>
                <textarea
                  rows={3}
                  value={hubHighlightsStr}
                  onChange={(e) => setHubHighlightsStr(e.target.value)}
                  placeholder="Panduan 30 Hari Full&#10;Lengkap Set & Reps"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Gambar Cover</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={hubImage}
                    onChange={(e) => setHubImage(e.target.value)}
                    placeholder="/images/background1.jpeg"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 border border-slate-300">
                    <Upload size={16} />
                    <span>{uploading ? 'Mengunggah...' : 'Unggah File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setHubImage)}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {hubImage && <img src={hubImage} alt="" className="mt-2 w-32 h-20 object-cover rounded-lg border border-slate-300" />}
                {hubUploadNote && <p className="text-[11px] text-slate-500 mt-1">{hubUploadNote}</p>}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hubIsActive}
                    onChange={(e) => setHubIsActive(e.target.checked)}
                    className="w-4 h-4 accent-brand-cyan rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 uppercase">Tampilkan / Aktif</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setHubStep('list')}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-cyan hover:bg-[#138496] text-white rounded-lg font-bold text-xs uppercase shadow-sm cursor-pointer"
                >
                  <Save size={16} />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Item Hub'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingHubId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="font-bold text-slate-800 text-sm uppercase">Konfirmasi Hapus Hub Card</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus item Hub ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingHubId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg uppercase border border-slate-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteHubItem(deletingHubId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg uppercase shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
