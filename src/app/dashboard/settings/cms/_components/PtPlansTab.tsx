'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Edit, X, Link as LinkIcon, Type } from 'lucide-react';
import { PTPlanItem } from './types';

interface PtPlansTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const PtPlansTab: React.FC<PtPlansTabProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [ptPlans, setPtPlans] = useState<PTPlanItem[]>([
    {
      id: 'pt-1-session',
      name: '1 SESI',
      duration_days: 30,
      session_count: 1,
      price: 150000,
      badge: 'Trial',
      popular: false,
      bonus_text: '',
      tagline: 'YANG ANDA DAPATKAN',
      features: [
        '1 kali sesi bersama Personal Trainer',
        'Jadwal fleksibel sesuai kesepakatan',
        'Program latihan disesuaikan kebutuhan',
        'Cocok untuk yang pertama kali mau coba coaching',
      ],
      featuresStr: '1 kali sesi bersama Personal Trainer\nJadwal fleksibel sesuai kesepakatan\nProgram latihan disesuaikan kebutuhan\nCocok untuk yang pertama kali mau coba coaching',
      button_text: 'DAFTAR SEKARANG',
      button_link: 'https://wa.me/p/9066064706772680/6285158889050',
    },
    {
      id: 'pt-3-session',
      name: '3 SESI',
      duration_days: 30,
      session_count: 3,
      price: 400000,
      original_price: 450000,
      badge: 'Hemat',
      popular: false,
      bonus_text: 'SETARA RP133.333 /SESI',
      tagline: 'YANG ANDA DAPATKAN',
      features: [
        'Masa aktif 1 bulan',
        'Jadwal fleksibel sesuai kesepakatan',
        'Cocok untuk mulai belajar teknik dasar',
        'Didampingi langsung oleh PT',
      ],
      featuresStr: 'Masa aktif 1 bulan\nJadwal fleksibel sesuai kesepakatan\nCocok untuk mulai belajar teknik dasar\nDidampingi langsung oleh PT',
      button_text: 'DAFTAR SEKARANG',
      button_link: 'https://wa.me/p/9728890043881333/6285158889050',
    },
    {
      id: 'pt-6-session',
      name: '6 SESI',
      duration_days: 30,
      session_count: 6,
      price: 750000,
      original_price: 900000,
      badge: 'POPULAR CHOICE',
      popular: true,
      bonus_text: 'SETARA RP125.000 /SESI',
      tagline: 'YANG ANDA DAPATKAN',
      features: [
        'Masa aktif 1 bulan',
        'Jadwal fleksibel sesuai kesepakatan',
        'Program lebih terarah sesuai goal',
        'Pendampingan rutin selama sesi',
      ],
      featuresStr: 'Masa aktif 1 bulan\nJadwal fleksibel sesuai kesepakatan\nProgram lebih terarah sesuai goal\nPendampingan rutin selama sesi',
      button_text: 'DAFTAR SEKARANG',
      button_link: 'https://wa.me/p/9013236362130291/6285158889050',
    },
    {
      id: 'pt-12-session',
      name: '12 SESI',
      duration_days: 30,
      session_count: 12,
      price: 1200000,
      original_price: 1800000,
      badge: 'Transformation',
      popular: false,
      bonus_text: 'SETARA RP100.000 /SESI',
      tagline: 'YANG ANDA DAPATKAN',
      features: [
        'Masa aktif 1 bulan',
        'Jadwal fleksibel sesuai kesepakatan',
        'Program latihan lebih konsisten',
        'Cocok untuk target transformasi lebih serius',
      ],
      featuresStr: 'Masa aktif 1 bulan\nJadwal fleksibel sesuai kesepakatan\nProgram latihan lebih konsisten\nCocok untuk target transformasi lebih serius',
      button_text: 'DAFTAR SEKARANG',
      button_link: 'https://wa.me/p/28674323278848434/6285158889050',
    },
  ]);
  const [editingPtPlan, setEditingPtPlan] = useState<PTPlanItem | null>(null);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchPtData();
  }, []);

  const fetchPtData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await api.get<any>('/public/pricing');
      if (res.success && res.data && res.data.ptPlans) {
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
            bonus_text: p.bonusText || p.registrationFeeNote || '',
            discount_badge: p.discountBadge || '',
            tagline: p.tagline || '',
            features: Array.isArray(p.features) ? p.features : [],
            featuresStr: Array.isArray(p.features) ? p.features.join('\n') : '',
            button_text: p.buttonText || p.button_text || 'DAFTAR SEKARANG',
            button_link: p.buttonLink || p.button_link || '',
          }))
        );
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memuat data paket Personal Trainer');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSavePtPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPtPlan) return;

    setLoading(true);
    try {
      const featArray = typeof editingPtPlan.featuresStr === 'string'
        ? editingPtPlan.featuresStr.split('\n').map((s) => s.trim()).filter(Boolean)
        : (editingPtPlan.features || []);

      const payload = {
        name: editingPtPlan.name,
        price: Number(editingPtPlan.price),
        original_price: editingPtPlan.original_price ? Number(editingPtPlan.original_price) : null,
        badge: editingPtPlan.badge || '',
        popular: editingPtPlan.popular,
        bonus_text: editingPtPlan.bonus_text || '',
        discount_badge: editingPtPlan.discount_badge || '',
        tagline: editingPtPlan.tagline || '',
        features: featArray,
        button_text: editingPtPlan.button_text || 'DAFTAR SEKARANG',
        button_link: editingPtPlan.button_link || '',
      };

      const res = await api.put(`/admin/pt-packages/${editingPtPlan.id}`, payload);
      if (res.success) {
        onSuccess(`Paket Personal Trainer "${editingPtPlan.name}" berhasil diperbarui!`);
        setEditingPtPlan(null);
        fetchPtData();
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memperbarui paket Personal Trainer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {editingPtPlan ? (
        /* EDIT FORM MODAL / CARD FORM */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full space-y-0">
          <div className="bg-brand-cyan px-5 py-3.5 text-white font-bold flex items-center justify-between select-none">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider font-heading text-white">
                Edit Konten PT Card: <span className="underline">{editingPtPlan.name}</span>
              </h3>
            </div>
            <button onClick={() => setEditingPtPlan(null)} className="text-slate-700 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSavePtPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Paket PT</label>
                  <input
                    type="text"
                    value={editingPtPlan.name}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jumlah Sesi Saja</label>
                  <input
                    type="number"
                    value={editingPtPlan.session_count}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, session_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Promo (Rp)</label>
                  <input
                    type="number"
                    value={editingPtPlan.price}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Asli / Sebelum Promo (Rp)</label>
                  <input
                    type="number"
                    value={editingPtPlan.original_price || ''}
                    onChange={(e) =>
                      setEditingPtPlan({ ...editingPtPlan, original_price: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="mis. 900000 (opsional)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-cyan uppercase mb-1 flex items-center gap-1">
                    <span>🏷️ PROMO BADGE / STATUS CARD</span>
                  </label>
                  <input
                    type="text"
                    value={editingPtPlan.badge || ''}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, badge: e.target.value })}
                    placeholder="mis. TRIAL / HEMAT / POPULAR CHOICE"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan Pendaftaran / Bonus Text</label>
                  <input
                    type="text"
                    value={editingPtPlan.bonus_text || ''}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, bonus_text: e.target.value })}
                    placeholder="mis. Didampingi langsung oleh PT"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* Action Button Dynamic Settings (Teks Tombol & Link Target Href) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <Type size={12} />
                    <span>Teks Tombol Action</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPtPlan.button_text || ''}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, button_text: e.target.value })}
                    placeholder="DAFTAR SEKARANG"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <LinkIcon size={12} />
                    <span>Link Target (Href / WhatsApp Catalog)</span>
                  </label>
                  <input
                    type="text"
                    value={editingPtPlan.button_link || ''}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, button_link: e.target.value })}
                    placeholder="https://wa.me/p/..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline Card (Sub-Judul Singkat)</label>
                <input
                  type="text"
                  value={editingPtPlan.tagline || ''}
                  onChange={(e) => setEditingPtPlan({ ...editingPtPlan, tagline: e.target.value })}
                  placeholder="mis. Target hasil lebih cepat"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fitur Paket PT / "Yang Anda Dapatkan" (1 Poin per Baris / Enter)
                </label>
                <textarea
                  rows={4}
                  value={editingPtPlan.featuresStr !== undefined ? editingPtPlan.featuresStr : (editingPtPlan.features?.join('\n') || '')}
                  onChange={(e) => setEditingPtPlan({ ...editingPtPlan, featuresStr: e.target.value })}
                  placeholder="Masa aktif 1 bulan&#10;Jadwal fleksibel sesuai kesepakatan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-body leading-relaxed"
                />
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPtPlan.popular || false}
                    onChange={(e) => setEditingPtPlan({ ...editingPtPlan, popular: e.target.checked })}
                    className="w-4 h-4 accent-brand-cyan rounded shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      Promo / Highlight
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Aktifkan untuk memberikan bingkai menonjol dan pita promo pada kartu PT di landing page.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPtPlan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-cyan hover:bg-[#138496] text-white rounded-lg font-bold text-xs uppercase shadow-sm cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan PT Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* CARDS LIST DISPLAY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ptPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 space-y-4 relative flex flex-col justify-between shadow-sm ${plan.popular ? 'border-brand-cyan ring-2 ring-brand-cyan/20' : 'border-slate-200'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6 bg-brand-cyan text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  🔥 SEDANG PROMO
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-cyan uppercase">{plan.badge || 'Coaching'}</span>
                  <span className="text-xs text-slate-500 font-bold">{plan.session_count} Sesi</span>
                </div>

                <h4 className="font-heading text-xl font-extrabold text-slate-800 uppercase italic">{plan.name}</h4>

                <div>
                  {plan.original_price && (
                    <span className="text-slate-400 text-xs line-through block font-mono">
                      Rp{plan.original_price.toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="font-heading text-2xl font-extrabold text-slate-900 italic">
                    Rp{plan.price.toLocaleString('id-ID')}
                  </span>
                </div>

                {plan.tagline && <p className="text-xs text-slate-500 font-body">{plan.tagline}</p>}
              </div>

              <button
                onClick={() => setEditingPtPlan(plan)}
                className="w-full py-2.5 bg-slate-100 hover:bg-brand-cyan text-slate-700 hover:text-white border border-slate-200 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit Content & Promo Card</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
