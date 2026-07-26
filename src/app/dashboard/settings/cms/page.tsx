'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { contentsApi } from '@/core/api';
import api from '@/lib/api';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import { Plus, Edit, Trash2, Save, ArrowLeft, Search, Upload, Eye, EyeOff } from 'lucide-react';

interface CMSContent {
  id: string;
  type: string;
  title: string;
  description?: string;
  image_url?: string;
  metadata?: any;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'news', label: 'News / Berita' },
  { value: 'promo', label: 'Promo / Event' },
  { value: 'membership', label: 'Membership Info' },
  { value: 'tips', label: 'Tips & Tutorial' },
  { value: 'facilities', label: 'Fasilitas & Alat' },
  { value: 'gallery', label: 'Galeri Foto' },
];

export default function CMSManagementPage() {
  const { user } = useAuth();
  const [contents, setContents] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');

  // Form modal/step state: 'list' | 'create' | 'edit'
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('news');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Extra Metadata fields
  const [price, setPrice] = useState<number>(250000);
  const [period, setPeriod] = useState('/bulan');
  const [schedule, setSchedule] = useState('Setiap Hari, 06:00 – 22:00');
  const [featuresStr, setFeaturesStr] = useState('Free Weights & Machines\nCardio Zone\nLocker Room\nShower & Towel\nFree WiFi\nParking');
  const [popular, setPopular] = useState(false);
  const [categoryTag, setCategoryTag] = useState('Event');

  // Delete confirm modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeFilter = activeType === 'all' ? '' : activeType;
      const res = await contentsApi.listAdmin(typeFilter);
      setContents(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data konten CMS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [activeType]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setType('news');
    setDescription('');
    setImageUrl('');
    setIsPublished(true);
    setPrice(250000);
    setPeriod('/bulan');
    setSchedule('Setiap Hari, 06:00 – 22:00');
    setFeaturesStr('Free Weights & Machines\nCardio Zone\nLocker Room\nShower & Towel\nFree WiFi\nParking');
    setPopular(false);
    setCategoryTag('Event');
    setError(null);
    setSuccess(null);
    setStep('create');
  };

  const handleOpenEdit = (item: CMSContent) => {
    setEditingId(item.id);
    setTitle(item.title);
    setType(item.type || 'news');
    setDescription(item.description || '');
    setImageUrl(item.image_url || '');
    setIsPublished(item.is_published);
    if (item.metadata) {
      setPrice(item.metadata.price ? Number(item.metadata.price) : 250000);
      setPeriod(item.metadata.period || '/bulan');
      setSchedule(item.metadata.schedule || 'Setiap Hari, 06:00 – 22:00');
      setPopular(!!item.metadata.popular);
      setFeaturesStr(Array.isArray(item.metadata.features) ? item.metadata.features.join('\n') : 'Free Weights & Machines\nCardio Zone');
      setCategoryTag(item.metadata.category || 'Event');
    }
    setError(null);
    setSuccess(null);
    setStep('edit');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      if (res.success && res.data?.url) {
        setImageUrl(res.data.url);
      } else {
        setError('Gagal mengunggah gambar');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul konten wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const metadata: Record<string, any> = {};
    if (type === 'membership') {
      metadata.price = price ? Number(price) : 250000;
      metadata.period = period || '/bulan';
      metadata.schedule = schedule || 'Setiap Hari, 06:00 – 22:00';
      metadata.popular = popular;
      metadata.features = featuresStr.split('\n').map(f => f.trim()).filter(Boolean);
    } else {
      metadata.category = categoryTag || (type === 'promo' ? 'Promo' : type === 'tips' ? 'Tips' : 'Event');
    }

    const payload = {
      title,
      type,
      description,
      image_url: imageUrl,
      is_published: isPublished,
      metadata,
    };

    try {
      if (step === 'create') {
        await contentsApi.create(payload);
        setSuccess('Konten berhasil ditambahkan');
      } else {
        await contentsApi.update(editingId!, payload);
        setSuccess('Konten berhasil diperbarui');
      }
      setStep('list');
      fetchContents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan konten CMS');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await contentsApi.delete(id);
      setSuccess('Konten berhasil dihapus');
      setDeletingId(null);
      fetchContents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus konten');
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const columns: Column<CMSContent>[] = [
    {
      key: 'title',
      header: 'Konten / Judul',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
              NO IMG
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-800 text-sm block">{item.title}</span>
            <span className="text-slate-500 text-xs line-clamp-1 max-w-[280px]">
              {item.description || 'Tanpa deskripsi'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Kategori / Tipe',
      render: (item) => {
        const cat = CATEGORY_OPTIONS.find(c => c.value === item.type);
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {cat ? cat.label : item.type}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status Terbit',
      render: (item) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          item.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
          {item.is_published ? 'Terbit' : 'Draft'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      render: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Konten"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Konten"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Content (CMS)"
        description="Kelola berita, promo, tips fitness, dan informasi membership untuk tampilan client PrabuGym"
        action={
          step === 'list' ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Tambah Konten Baru</span>
            </button>
          ) : (
            <button
              onClick={() => setStep('list')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-300 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar</span>
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {step === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Konten
              </button>
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeType === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DataTable
            data={filteredContents}
            columns={columns}
            loading={loading}
            emptyMessage="Belum ada konten CMS yang ditambahkan"
          />
        </div>
      ) : (
        /* Create / Edit Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">
              {step === 'create' ? 'Tambah Konten CMS Baru' : 'Edit Konten CMS'}
            </h3>
            <p className="text-xs text-slate-500">Lengkapi formulir di bawah ini untuk memperbarui konten publik</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Judul Konten <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: GYM, Aerobik, Promo Akhir Tahun..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kategori / Tipe <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Status Publikasi
                </label>
                <select
                  value={isPublished ? 'true' : 'false'}
                  onChange={(e) => setIsPublished(e.target.value === 'true')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Terbitkan (Public)</option>
                  <option value="false">Simpan Draf (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Metadata Fields based on Type */}
            {type === 'membership' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Detil Membership</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="250000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Periode</label>
                    <input
                      type="text"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="/bulan"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal</label>
                    <input
                      type="text"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      placeholder="Setiap Hari, 06:00 – 22:00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fasilitas Termasuk (1 per baris)</label>
                  <textarea
                    rows={4}
                    value={featuresStr}
                    onChange={(e) => setFeaturesStr(e.target.value)}
                    placeholder="Free Weights & Machines&#10;Cardio Zone&#10;Locker Room&#10;Shower & Towel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="popular-check"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="popular-check" className="text-xs font-semibold text-slate-800">
                    Tandai sebagai Paket Rekomendasi Utama (Highlighted Card)
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tag / Kategori Tampilan</label>
                <input
                  type="text"
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  placeholder="Contoh: Promo, Event, Tips, Alat Baru"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Gambar Utama / Banner
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/background1.jpeg atau https://..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs cursor-pointer border border-slate-200">
                  <Upload size={14} />
                  <span>{uploading ? 'Mengunggah...' : 'Upload File'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Deskripsi / Ringkasan Konten
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan deskripsi lengkap atau ringkasan di sini..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('list')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Konten'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Konfirmasi Hapus Konten</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus konten CMS ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
