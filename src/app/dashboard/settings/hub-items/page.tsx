'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { Plus, Edit, Trash2, Save, ArrowLeft, Search, Upload } from 'lucide-react';

interface HubItem {
  id: string;
  title: string;
  category: 'downloads' | 'videos' | 'exclusive' | 'merchandise';
  categoryLabel: string;
  badge: string;
  price: string;
  originalPrice?: string;
  isFree: boolean;
  isMemberOnly: boolean;
  description: string;
  image: string;
  actionType: 'download' | 'video' | 'whatsapp' | 'claim';
  format?: string;
  iconSymbol: string;
  rating: string;
  stats: string;
  highlights: string[];
  sortOrder: number;
  isActive: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'downloads', label: '📚 Downloads (E-Book & Sheet)' },
  { value: 'videos', label: '🎥 Videos (Tutorial & Guide)' },
  { value: 'exclusive', label: '⭐ Member Exclusive' },
  { value: 'merchandise', label: '🛍️ Merchandise (Apparel & Gear)' },
];

export default function HubItemsManagementPage() {
  const [items, setItems] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'downloads' | 'videos' | 'exclusive' | 'merchandise'>('downloads');
  const [categoryLabel, setCategoryLabel] = useState('Downloads');
  const [badge, setBadge] = useState('E-Book PDF');
  const [price, setPrice] = useState('GRATIS');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [isMemberOnly, setIsMemberOnly] = useState(false);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/images/background1.jpeg');
  const [actionType, setActionType] = useState<'download' | 'video' | 'whatsapp' | 'claim'>('download');
  const [format, setFormat] = useState('PDF • 4.2 MB');
  const [iconSymbol, setIconSymbol] = useState('📚');
  const [rating, setRating] = useState('⭐ 4.9');
  const [stats, setStats] = useState('1,000+ Diunduh');
  const [highlightsStr, setHighlightsStr] = useState('Panduan Full\nSiap Cetak / Mobile');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<HubItem[]>('/admin/hub-items');
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error || 'Gagal mengambil data hub items');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data hub items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setCategory('downloads');
    setCategoryLabel('Downloads');
    setBadge('E-Book PDF');
    setPrice('GRATIS');
    setOriginalPrice('');
    setIsFree(true);
    setIsMemberOnly(false);
    setDescription('');
    setImage('/images/background1.jpeg');
    setActionType('download');
    setFormat('PDF • 4.2 MB');
    setIconSymbol('📚');
    setRating('⭐ 4.9');
    setStats('1,000+ Diunduh');
    setHighlightsStr('Panduan 30 Hari Full\nLengkap Set & Reps\nSiap Cetak / Mobile');
    setSortOrder(1);
    setIsActive(true);
    setStep('create');
  };

  const handleOpenEdit = (item: HubItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setCategoryLabel(item.categoryLabel || 'Downloads');
    setBadge(item.badge);
    setPrice(item.price);
    setOriginalPrice(item.originalPrice || '');
    setIsFree(item.isFree);
    setIsMemberOnly(item.isMemberOnly);
    setDescription(item.description);
    setImage(item.image);
    setActionType(item.actionType);
    setFormat(item.format || '');
    setIconSymbol(item.iconSymbol || '📚');
    setRating(item.rating || '⭐ 4.9');
    setStats(item.stats || '100+ Diunduh');
    const hl = Array.isArray(item.highlights) ? item.highlights.join('\n') : '';
    setHighlightsStr(hl);
    setSortOrder(item.sortOrder || 1);
    setIsActive(item.isActive);
    setStep('edit');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await api.uploadImage(formData);
      if (res.success && res.data?.url) {
        setImage(res.data.url);
        setSuccess('Gambar berhasil diunggah');
      } else {
        setError(res.error || 'Gagal mengunggah gambar');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const highlightsArray = highlightsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title,
      category,
      categoryLabel: categoryLabel || category.toUpperCase(),
      badge,
      price,
      originalPrice: originalPrice || undefined,
      isFree,
      isMemberOnly,
      description,
      image,
      actionType,
      format: format || undefined,
      iconSymbol,
      rating,
      stats,
      highlights: highlightsArray,
      sortOrder,
      isActive,
    };

    try {
      if (step === 'create') {
        const res = await api.post('/admin/hub-items', payload);
        if (res.success) {
          setSuccess('Hub Item berhasil dibuat');
          setStep('list');
          fetchItems();
        } else {
          setError(res.error || 'Gagal membuat hub item');
        }
      } else {
        const res = await api.put(`/admin/hub-items/${editingId}`, payload);
        if (res.success) {
          setSuccess('Hub Item berhasil diperbarui');
          setStep('list');
          fetchItems();
        } else {
          setError(res.error || 'Gagal memperbarui hub item');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/admin/hub-items/${id}`);
      if (res.success) {
        setSuccess('Hub Item berhasil dihapus');
        setDeletingId(null);
        fetchItems();
      } else {
        setError(res.error || 'Gagal menghapus hub item');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus hub item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      search === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const columns: Column<HubItem>[] = [
    {
      key: 'title',
      header: 'Produk Hub',
      render: (item) => (
        <div className="flex items-center gap-3">
          <img src={item.image} alt="" className="w-12 h-10 object-cover rounded-md bg-slate-800" />
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>{item.iconSymbol}</span>
              <span>{item.title}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">{item.format || item.badge}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-red-400 border border-red-500/20 uppercase">
          {item.categoryLabel || item.category}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      render: (item) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400">{item.price}</span>
          {item.originalPrice && <span className="block text-slate-500 line-through text-[10px]">{item.originalPrice}</span>}
        </div>
      ),
    },
    {
      key: 'isActive',
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
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            className="p-1.5 bg-slate-800 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Prabu Hub (Digital & Store)"
        description="Kelola file e-book, video tutorial, materi member VIP, dan merchandise resmi PRABU GYM."
        action={
          step === 'list' ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Hub Item</span>
            </button>
          ) : (
            <button
              onClick={() => setStep('list')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar</span>
            </button>
          )
        }
      />

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">{error}</div>}
      {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium">{success}</div>}

      {step === 'list' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {[{ value: 'all', label: 'Semua' }, ...CATEGORY_OPTIONS].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${activeCategory === cat.value ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Cari judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            </div>
          </div>

          <DataTable columns={columns} data={filteredItems} loading={loading} />
        </div>
      )}

      {(step === 'create' || step === 'edit') && (
        <form onSubmit={handleSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 max-w-4xl">
          <h2 className="text-xl font-bold text-white mb-4">
            {step === 'create' ? 'Tambah Hub Item Baru' : 'Edit Hub Item'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Judul Item</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mis. Prabu Starter Workout Program 30 Hari"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setCategory(val);
                  if (val === 'downloads') {
                    setCategoryLabel('Downloads');
                    setActionType('download');
                  } else if (val === 'videos') {
                    setCategoryLabel('Videos');
                    setActionType('video');
                  } else if (val === 'exclusive') {
                    setCategoryLabel('Member Exclusive');
                    setActionType('claim');
                  } else {
                    setCategoryLabel('Merchandise');
                    setActionType('whatsapp');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Badge Tag</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="mis. E-Book PDF / Masterclass / Apparel Resmi"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Tampilan</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="mis. GRATIS / MEMBER FREE / Rp189.000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Asli (Coret)</label>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="mis. Rp229.000 (opsional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Format / Keterangan Ukuran</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="mis. PDF • 4.2 MB / Video HD • 24 Min / Ukuran S - XXL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipe Aksi Tombol</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="download">Download PDF</option>
                <option value="video">Tonton Tutorial</option>
                <option value="claim">Akses Member VIP</option>
                <option value="whatsapp">Pesan via WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Deskripsi Lengkap</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail produk/materi..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Poin Fitur Unggulan (Satu per baris)</label>
            <textarea
              rows={3}
              value={highlightsStr}
              onChange={(e) => setHighlightsStr(e.target.value)}
              placeholder="Panduan 30 Hari Full&#10;Lengkap Set & Reps&#10;Siap Cetak / Mobile"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL Gambar Sampul</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Mengunggah...' : 'Unggah File'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            {image && <img src={image} alt="" className="mt-2 w-32 h-20 object-cover rounded-xl border border-slate-800" />}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-sm font-bold text-white">Tampilkan / Aktif</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep('list')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Item</span>
            </button>
          </div>
        </form>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Konfirmasi Hapus</h3>
            <p className="text-slate-400 text-sm">Apakah Anda yakin ingin menghapus Hub Item ini?</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                Batal
              </button>
              <button onClick={() => handleDelete(deletingId)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
