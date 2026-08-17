'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Edit, Link as LinkIcon, Type } from 'lucide-react';
import { MembershipPlanItem } from './types';

interface MembershipTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const MembershipTab: React.FC<MembershipTabProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanItem[]>([]);
  const [editingMemPlan, setEditingMemPlan] = useState<MembershipPlanItem | null>(null);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await api.get<any>('/public/pricing');
      if (res.success && res.data && res.data.membershipPlans) {
        setMembershipPlans(
          res.data.membershipPlans.map((p: any) => ({
            id: p.id,
            name: p.name,
            duration_days: p.durationDays || 30,
            price: p.priceTotal || p.price || 0,
            original_price: p.originalPriceTotal || p.originalPrice || undefined,
            badge: p.badge || 'BASIC',
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
      onError(err.message || 'Gagal memuat data paket membership');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSaveMemPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemPlan) return;

    setLoading(true);
    try {
      const featArray = typeof editingMemPlan.featuresStr === 'string'
        ? editingMemPlan.featuresStr.split('\n').map((s) => s.trim()).filter(Boolean)
        : (editingMemPlan.features || []);

      const payload = {
        name: editingMemPlan.name,
        price: Number(editingMemPlan.price),
        original_price: editingMemPlan.original_price ? Number(editingMemPlan.original_price) : null,
        badge: editingMemPlan.badge || '',
        popular: editingMemPlan.popular,
        bonus_text: editingMemPlan.bonus_text || '',
        discount_badge: editingMemPlan.discount_badge || '',
        tagline: editingMemPlan.tagline || '',
        features: featArray,
        button_text: editingMemPlan.button_text || 'DAFTAR SEKARANG',
        button_link: editingMemPlan.button_link || '',
      };

      const res = await api.put(`/admin/membership-packages/${editingMemPlan.id}`, payload);
      if (res.success) {
        onSuccess(`Paket Membership "${editingMemPlan.name}" berhasil diperbarui!`);
        setEditingMemPlan(null);
        fetchMembershipData();
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memperbarui paket membership');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {editingMemPlan ? (
        /* EDIT FORM MODAL / CARD FORM */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full space-y-0">
          <div className="bg-brand-cyan px-5 py-3.5 text-white font-bold flex items-center justify-between select-none">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider font-heading text-white">
                Edit Konten Card: <span className="underline">{editingMemPlan.name}</span>
              </h3>
              <p className="text-[11px] text-teal-100 font-normal mt-0.5">Update harga, promo badge, action button, dan tagline tampilan kartu.</p>
            </div>
            <button
              onClick={() => setEditingMemPlan(null)}
              className="text-xs font-bold uppercase text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              Batal
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSaveMemPlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Paket</label>
                  <input
                    type="text"
                    disabled
                    value={editingMemPlan.name}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Badge / Label Diskon</label>
                  <input
                    type="text"
                    value={editingMemPlan.discount_badge || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, discount_badge: e.target.value })}
                    placeholder="mis. HEMAT 50RB / DISKON 10%"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingMemPlan.price}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Asli / Sebelum Promo (Rp)</label>
                  <input
                    type="number"
                    value={editingMemPlan.original_price || ''}
                    onChange={(e) =>
                      setEditingMemPlan({ ...editingMemPlan, original_price: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="mis. 750000 (opsional)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17A2B8] uppercase mb-1 flex items-center gap-1">
                    <span>🏷️ PROMO BADGE / STATUS CARD</span>
                  </label>
                  <input
                    type="text"
                    value={editingMemPlan.badge || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, badge: e.target.value })}
                    placeholder="mis. BASIC / FLEKSIBEL / POPULAR CHOICE"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan Pendaftaran / Bonus Text</label>
                  <input
                    type="text"
                    value={editingMemPlan.bonus_text || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, bonus_text: e.target.value })}
                    placeholder="mis. + Biaya pendaftaran Rp50.000 (1x)"
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
                    value={editingMemPlan.button_text || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, button_text: e.target.value })}
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
                    value={editingMemPlan.button_link || ''}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, button_link: e.target.value })}
                    placeholder="https://wa.me/p/..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline Card (Sub-Judul Singkat)</label>
                <input
                  type="text"
                  value={editingMemPlan.tagline || ''}
                  onChange={(e) => setEditingMemPlan({ ...editingMemPlan, tagline: e.target.value })}
                  placeholder="mis. Favorit member baru"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fitur Paket / "Yang Anda Dapatkan" (1 Poin per Baris / Enter)
                </label>
                <textarea
                  rows={4}
                  value={editingMemPlan.featuresStr !== undefined ? editingMemPlan.featuresStr : (editingMemPlan.features?.join('\n') || '')}
                  onChange={(e) => setEditingMemPlan({ ...editingMemPlan, featuresStr: e.target.value })}
                  placeholder="Masa aktif membership selama 90 hari&#10;Kunjungan tanpa batas selama masa aktif"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-body leading-relaxed"
                />
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMemPlan.popular || false}
                    onChange={(e) => setEditingMemPlan({ ...editingMemPlan, popular: e.target.checked })}
                    className="w-4 h-4 accent-[#17A2B8] rounded shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      Promo / Highlight
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Aktifkan untuk memberikan bingkai menonjol dan pita promo pada kartu di landing page.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMemPlan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-cyan hover:bg-[#138496] text-white rounded-lg font-bold text-xs uppercase shadow-sm cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* CARDS LIST DISPLAY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membershipPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 space-y-4 relative flex flex-col justify-between shadow-sm ${plan.popular ? 'border-[#17A2B8] ring-2 ring-[#17A2B8]/20' : 'border-slate-200'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6 bg-brand-cyan text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  🔥 SEDANG PROMO
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17A2B8] uppercase">{plan.badge || 'Reguler'}</span>
                  <span className="text-xs text-slate-500 font-bold">{plan.duration_days} Hari</span>
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
                onClick={() => setEditingMemPlan(plan)}
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
