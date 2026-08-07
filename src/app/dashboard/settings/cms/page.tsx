'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PageHeader } from '@/components/core/PageHeader';
import { DataTable, Column } from '@/components/core/DataTable';
import {
  Image as ImageIcon,
  CreditCard,
  Dumbbell,
  ShoppingBag,
  Edit,
  Trash2,
  Plus,
  Save,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

type CMSTab = 'promo' | 'membership' | 'pt' | 'hub';

// Types
interface MembershipPlanItem {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  original_price?: number;
  badge?: string;
  popular?: boolean;
  monthly_breakdown?: string;
  bonus_text?: string;
  discount_badge?: string;
  description?: string;
}

interface PTPlanItem {
  id: string;
  name: string;
  duration_days: number;
  session_count: number;
  price: number;
  original_price?: number;
  badge?: string;
  popular?: boolean;
  monthly_breakdown?: string;
  bonus_text?: string;
  discount_badge?: string;
  description?: string;
}

interface HubCardItem {
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
  rating: string;
  stats: string;
  highlights: string[];
  sortOrder: number;
  isActive: boolean;
}

export default function CMSManagementPage() {
  const [activeTab, setActiveTab] = useState<CMSTab>('promo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. PROMO BANNER STATE
  const [promoImageUrl, setPromoImageUrl] = useState('/images/promox.png');

  // 2. MEMBERSHIP PLANS STATE
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanItem[]>([]);
  const [editingMemPlan, setEditingMemPlan] = useState<MembershipPlanItem | null>(null);

  // 3. PT PLANS STATE
  const [ptPlans, setPtPlans] = useState<PTPlanItem[]>([]);
  const [editingPtPlan, setEditingPtPlan] = useState<PTPlanItem | null>(null);

  // 4. HUB CARDS STATE (FULL CRUD)
  const [hubItems, setHubItems] = useState<HubCardItem[]>([]);
  const [hubStep, setHubStep] = useState<'list' | 'create' | 'edit'>('list');
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [deletingHubId, setDeletingHubId] = useState<string | null>(null);
  const [hubSearch, setHubSearch] = useState('');

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

  // FETCH DATA ACCORDING TO ACTIVE TAB
  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'promo') {
        const res = await api.get<{ imageUrl: string }>('/public/promo-image');
        if (res.success && res.data?.imageUrl) {
          setPromoImageUrl(res.data.imageUrl);
        }
      } else if (activeTab === 'membership' || activeTab === 'pt') {
        const res = await api.get<any>('/public/pricing');
        if (res.success && res.data) {
          if (res.data.membershipPlans) {
            setMembershipPlans(
              res.data.membershipPlans.map((p: any) => ({
                id: p.id,
                name: p.name,
                duration_days: p.durationDays || 30,
                price: p.priceTotal || p.price || 0,
                original_price: p.originalPriceTotal || p.originalPrice || undefined,
                badge: p.badge || 'Reguler',
                popular: !!p.popular,
                monthly_breakdown: p.monthlyBreakdown || '',
                bonus_text: p.bonusText || '',
                discount_badge: p.discountBadge || '',
                description: p.tagline || p.description || '',
              }))
            );
          }
          if (res.data.ptPlans) {
            setPtPlans(
              res.data.ptPlans.map((p: any) => ({
                id: p.id,
                name: p.name,
                duration_days: p.durationDays || 30,
                session_count: p.sessionCount || 1,
                price: p.priceTotal || p.price || 0,
                original_price: p.originalPriceTotal || p.originalPrice || undefined,
                badge: p.badge || 'Coaching',
                popular: !!p.popular,
                monthly_breakdown: p.monthlyBreakdown || '',
                bonus_text: p.bonusText || '',
                discount_badge: p.discountBadge || '',
                description: p.tagline || p.description || '',
              }))
            );
          }
        }
      } else if (activeTab === 'hub') {
        const res = await api.get<HubCardItem[]>('/admin/hub-items');
        if (res.success && res.data) {
          setHubItems(res.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data CMS');
    } finally {
      setLoading(false);
    }
  };

  // UPLOAD IMAGE HELPER
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetSetter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      if (res.success && res.data?.url) {
        targetSetter(res.data.url);
        setSuccess('Gambar berhasil diunggah!');
      } else {
        setError('Gagal mengunggah gambar');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  // 1. SAVE PROMO IMAGE URL
  const handleSavePromoImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoImageUrl.trim()) {
      setError('URL Gambar Promo tidak boleh kosong');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put('/admin/promo-image', { imageUrl: promoImageUrl });
      if (res.success) {
        setSuccess('URL Gambar Promo berhasil diperbarui!');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui gambar promo');
    } finally {
      setLoading(false);
    }
  };

  // 2. SAVE MEMBERSHIP PLAN CARD UPDATE
  const handleSaveMemPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemPlan) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: editingMemPlan.name,
        price: Number(editingMemPlan.price),
        original_price: editingMemPlan.original_price ? Number(editingMemPlan.original_price) : null,
        badge: editingMemPlan.badge || '',
        popular: editingMemPlan.popular,
        monthly_breakdown: editingMemPlan.monthly_breakdown || '',
        bonus_text: editingMemPlan.bonus_text || '',
        discount_badge: editingMemPlan.discount_badge || '',
        description: editingMemPlan.description || '',
      };

      const res = await api.put(`/admin/membership-packages/${editingMemPlan.id}`, payload);
      if (res.success) {
        setSuccess(`Paket Membership "${editingMemPlan.name}" berhasil diperbarui!`);
        setEditingMemPlan(null);
        fetchTabData();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui paket membership');
    } finally {
      setLoading(false);
    }
  };

  // 3. SAVE PT PLAN CARD UPDATE
  const handleSavePtPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPtPlan) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: editingPtPlan.name,
        price: Number(editingPtPlan.price),
        original_price: editingPtPlan.original_price ? Number(editingPtPlan.original_price) : null,
        badge: editingPtPlan.badge || '',
        popular: editingPtPlan.popular,
        monthly_breakdown: editingPtPlan.monthly_breakdown || '',
        bonus_text: editingPtPlan.bonus_text || '',
        discount_badge: editingPtPlan.discount_badge || '',
        description: editingPtPlan.description || '',
      };

      const res = await api.put(`/admin/pt-packages/${editingPtPlan.id}`, payload);
      if (res.success) {
        setSuccess(`Paket Personal Trainer "${editingPtPlan.name}" berhasil diperbarui!`);
        setEditingPtPlan(null);
        fetchTabData();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui paket Personal Trainer');
    } finally {
      setLoading(false);
    }
  };

  // 4. HUB CARDS CRUD HANDLERS
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
      setError('Judul Hub Card wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

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
        setSuccess('Hub Card baru berhasil ditambahkan!');
      } else {
        await api.put(`/admin/hub-items/${editingHubId}`, payload);
        setSuccess('Hub Card berhasil diperbarui!');
      }
      setHubStep('list');
      fetchTabData();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan item Hub Card');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHubItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/admin/hub-items/${id}`);
      setSuccess('Hub Card berhasil dihapus!');
      setDeletingHubId(null);
      fetchTabData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus item Hub Card');
    } finally {
      setLoading(false);
    }
  };

  const filteredHubItems = hubItems.filter(
    (item) =>
      item.title.toLowerCase().includes(hubSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(hubSearch.toLowerCase())
  );

  // Hub DataTable Columns
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
          <span className="font-mono font-bold text-emerald-400 text-xs">{item.price}</span>
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
          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
            item.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
      <PageHeader
        title="Content Management System (CMS)"
        description="Kelola Banner Promo, Konten Paket Membership & PT, serta Produk Hub Store Prabu GYM"
        action={
          activeTab === 'hub' && hubStep === 'list' ? (
            <button
              onClick={handleOpenCreateHub}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
            >
              <Plus size={16} />
              <span>Tambah Hub Card Baru</span>
            </button>
          ) : null
        }
      />

      {/* ALERT NOTIFICATIONS */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl text-red-200 text-sm font-medium flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-200 text-sm font-medium flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TOP NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'promo', label: 'Image Promo (Landing)', icon: <ImageIcon size={16} /> },
          { id: 'membership', label: 'Paket Membership Cards', icon: <CreditCard size={16} /> },
          { id: 'pt', label: 'Paket Personal Trainer Cards', icon: <Dumbbell size={16} /> },
          { id: 'hub', label: 'Prabu Hub Cards (Store)', icon: <ShoppingBag size={16} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as CMSTab);
                setEditingMemPlan(null);
                setEditingPtPlan(null);
                setHubStep('list');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: IMAGE PROMO MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === 'promo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6">
          <div>
            <h3 className="text-lg font-extrabold uppercase italic text-white flex items-center gap-2">
              <ImageIcon className="text-red-500" size={20} />
              <span>Update Banner Image Promo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-body">
              Pembaruan URL gambar banner promo yang tampil pada section Promo Spesiap Landing Page (`PromoSection.tsx`).
            </p>
          </div>

          <form onSubmit={handleSavePromoImage} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                URL Gambar Promo <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  required
                  value={promoImageUrl}
                  onChange={(e) => setPromoImageUrl(e.target.value)}
                  placeholder="mis. /images/promox.png atau https://..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 border border-slate-700">
                  <Upload size={16} />
                  <span>{uploading ? 'Mengunggah...' : 'Unggah File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setPromoImageUrl)}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase">Live Image Preview</span>
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {promoImageUrl ? (
                  <img src={promoImageUrl} alt="Promo Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-600 text-xs">Belum ada URL gambar terpasang</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-600/30 transition-all"
              >
                <Save size={16} />
                <span>{loading ? 'Menyimpan...' : 'Simpan URL Banner Promo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MEMBERSHIP PLANS CARD UPDATE */}
      {/* ============================================================ */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          {editingMemPlan ? (
            /* EDIT FORM MODAL / CARD FORM */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold uppercase italic text-white">
                    Edit Konten Card: <span className="text-red-500">{editingMemPlan.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update harga, promo badge, dan tagline tampilan kartu.</p>
                </div>
                <button
                  onClick={() => setEditingMemPlan(null)}
                  className="text-xs font-bold uppercase text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSaveMemPlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Paket</label>
                    <input
                      type="text"
                      disabled
                      value={editingMemPlan.name}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Promo Badge / Status Card</label>
                    <input
                      type="text"
                      value={editingMemPlan.badge || ''}
                      onChange={(e) => setEditingMemPlan({ ...editingMemPlan, badge: e.target.value })}
                      placeholder="mis. Basic / Popular Choice / Best Value / Promo"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={editingMemPlan.price}
                      onChange={(e) => setEditingMemPlan({ ...editingMemPlan, price: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Asli / Sebelum Promo (Rp)</label>
                    <input
                      type="number"
                      value={editingMemPlan.original_price || ''}
                      onChange={(e) =>
                        setEditingMemPlan({ ...editingMemPlan, original_price: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="mis. 750000 (opsional)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tagline Card</label>
                  <input
                    type="text"
                    value={editingMemPlan.description || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, description: e.target.value })}
                    placeholder="mis. Favorit member baru / Tanpa komitmen panjang"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMemPlan.popular || false}
                      onChange={(e) => setEditingMemPlan({ ...editingMemPlan, popular: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-400" />
                      Tandai sebagai Paket Promo Rekomendasi Utama (Highlighted Red Ribbon)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingMemPlan(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-600/30"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan Card'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CARDS LIST DISPLAY */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-slate-900 border rounded-3xl p-6 space-y-4 relative flex flex-col justify-between ${
                    plan.popular ? 'border-red-600 ring-2 ring-red-600/20' : 'border-slate-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-6 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                      🔥 PROMO UTAMA
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-500 uppercase">{plan.badge || 'Reguler'}</span>
                      <span className="text-xs text-slate-400 font-bold">{plan.duration_days} Hari</span>
                    </div>

                    <h4 className="font-heading text-xl font-extrabold text-white uppercase italic">{plan.name}</h4>

                    <div>
                      {plan.original_price && (
                        <span className="text-slate-500 text-xs line-through block font-mono">
                          Rp{plan.original_price.toLocaleString('id-ID')}
                        </span>
                      )}
                      <span className="font-heading text-2xl font-extrabold text-white italic">
                        Rp{plan.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {plan.description && <p className="text-xs text-slate-400 font-body">{plan.description}</p>}
                  </div>

                  <button
                    onClick={() => setEditingMemPlan(plan)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Edit size={14} />
                    <span>Edit Content & Promo Card</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: PERSONAL TRAINER PLANS CARD UPDATE */}
      {/* ============================================================ */}
      {activeTab === 'pt' && (
        <div className="space-y-6">
          {editingPtPlan ? (
            /* EDIT FORM MODAL / CARD FORM */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold uppercase italic text-white">
                    Edit Konten PT Card: <span className="text-red-500">{editingPtPlan.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update harga, promo badge, dan tagline Personal Trainer.</p>
                </div>
                <button
                  onClick={() => setEditingPtPlan(null)}
                  className="text-xs font-bold uppercase text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSavePtPlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Paket PT</label>
                    <input
                      type="text"
                      disabled
                      value={editingPtPlan.name}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Promo Badge / Status Card</label>
                    <input
                      type="text"
                      value={editingPtPlan.badge || ''}
                      onChange={(e) => setEditingPtPlan({ ...editingPtPlan, badge: e.target.value })}
                      placeholder="mis. Trial / Basic / Hemat / Popular Choice"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={editingPtPlan.price}
                      onChange={(e) => setEditingPtPlan({ ...editingPtPlan, price: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Asli / Sebelum Promo (Rp)</label>
                    <input
                      type="number"
                      value={editingPtPlan.original_price || ''}
                      onChange={(e) =>
                        setEditingPtPlan({ ...editingPtPlan, original_price: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="mis. 900000 (opsional)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tagline Card</label>
                  <input
                    type="text"
                    value={editingPtPlan.description || ''}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, description: e.target.value })}
                    placeholder="mis. Target hasil lebih cepat / Fondasi teknik tepat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPtPlan.popular || false}
                      onChange={(e) => setEditingPtPlan({ ...editingPtPlan, popular: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-400" />
                      Tandai sebagai Paket PT Promo Utama (Highlighted Red Ribbon)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPtPlan(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-600/30"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan PT Card'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CARDS LIST DISPLAY */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ptPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-slate-900 border rounded-3xl p-6 space-y-4 relative flex flex-col justify-between ${
                    plan.popular ? 'border-red-600 ring-2 ring-red-600/20' : 'border-slate-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-6 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                      🔥 PROMO UTAMA PT
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-500 uppercase">{plan.badge || 'Coaching'}</span>
                      <span className="text-xs text-slate-400 font-bold">{plan.session_count} Sesi</span>
                    </div>

                    <h4 className="font-heading text-xl font-extrabold text-white uppercase italic">{plan.name}</h4>

                    <div>
                      {plan.original_price && (
                        <span className="text-slate-500 text-xs line-through block font-mono">
                          Rp{plan.original_price.toLocaleString('id-ID')}
                        </span>
                      )}
                      <span className="font-heading text-2xl font-extrabold text-white italic">
                        Rp{plan.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {plan.description && <p className="text-xs text-slate-400 font-body">{plan.description}</p>}
                  </div>

                  <button
                    onClick={() => setEditingPtPlan(plan)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Edit size={14} />
                    <span>Edit Content & Promo Card</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: PRABU HUB CARDS (FULL CRUD) */}
      {/* ============================================================ */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          {hubStep === 'list' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Cari Hub Item..."
                    value={hubSearch}
                    onChange={(e) => setHubSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-extrabold uppercase italic text-white">
                  {hubStep === 'create' ? 'Tambah Hub Card Baru' : 'Edit Item Hub Card'}
                </h3>
                <button
                  onClick={() => setHubStep('list')}
                  className="text-xs font-bold uppercase text-slate-400 hover:text-white bg-slate-800 px-3.5 py-2 rounded-xl"
                >
                  Kembali ke Daftar
                </button>
              </div>

              <form onSubmit={handleSaveHubItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Judul Item</label>
                  <input
                    type="text"
                    required
                    value={hubTitle}
                    onChange={(e) => setHubTitle(e.target.value)}
                    placeholder="mis. Prabu Starter Workout Program 30 Hari"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kategori</label>
                    <select
                      value={hubCategory}
                      onChange={(e) => setHubCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="downloads">Downloads (E-Book & Sheet)</option>
                      <option value="videos">Videos (Tutorial & Guide)</option>
                      <option value="exclusive">Member Exclusive</option>
                      <option value="merchandise">Merchandise (Apparel & Gear)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={hubBadge}
                      onChange={(e) => setHubBadge(e.target.value)}
                      placeholder="mis. E-Book PDF / Masterclass / Apparel Resmi"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Tampilan</label>
                    <input
                      type="text"
                      value={hubPrice}
                      onChange={(e) => setHubPrice(e.target.value)}
                      placeholder="mis. GRATIS / MEMBER FREE / Rp189.000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Harga Asli (Coret)</label>
                    <input
                      type="text"
                      value={hubOriginalPrice}
                      onChange={(e) => setHubOriginalPrice(e.target.value)}
                      placeholder="mis. Rp229.000 (opsional)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Format / Ket Ukuran</label>
                  <input
                    type="text"
                    value={hubFormat}
                    onChange={(e) => setHubFormat(e.target.value)}
                    placeholder="mis. PDF • 4.2 MB / Video HD • 24 Min / Ukuran S - XXL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Deskripsi Lengkap</label>
                  <textarea
                    rows={3}
                    required
                    value={hubDescription}
                    onChange={(e) => setHubDescription(e.target.value)}
                    placeholder="Jelaskan detail produk/materi..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Highlights (1 per baris)</label>
                  <textarea
                    rows={3}
                    value={hubHighlightsStr}
                    onChange={(e) => setHubHighlightsStr(e.target.value)}
                    placeholder="Panduan 30 Hari Full&#10;Lengkap Set & Reps"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL Gambar Cover</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={hubImage}
                      onChange={(e) => setHubImage(e.target.value)}
                      placeholder="/images/background1.jpeg"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
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
                  {hubImage && <img src={hubImage} alt="" className="mt-2 w-32 h-20 object-cover rounded-xl border border-slate-800" />}
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hubIsActive}
                      onChange={(e) => setHubIsActive(e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-sm font-bold text-white">Tampilkan / Aktif</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHubStep('list')}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-600/30"
                  >
                    <Save size={16} />
                    <span>Simpan Item Hub</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deletingHubId && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <h4 className="font-bold text-white text-base">Konfirmasi Hapus Hub Card</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus item Hub ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeletingHubId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl uppercase"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteHubItem(deletingHubId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase shadow-lg shadow-red-600/30"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
