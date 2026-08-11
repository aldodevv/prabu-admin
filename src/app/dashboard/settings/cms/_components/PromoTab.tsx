'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Image as ImageIcon, Save, Upload, Link as LinkIcon, Type } from 'lucide-react';
import { compressAndConvertToWebP } from './utils';

interface PromoTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export interface PromoSlideData {
  image: string;
  buttonText: string;
  buttonLink: string;
}

const DEFAULT_SLIDES: PromoSlideData[] = [
  { image: '/images/background5.jpeg', buttonText: 'LIHAT PAKET MEMBERSHIP →', buttonLink: '/membership' },
  { image: '/images/promox.png', buttonText: 'LIHAT PAKET PT →', buttonLink: '/membership#pt' },
  { image: '/images/background4.jpeg', buttonText: 'KLAIM PROMO SEKARANG →', buttonLink: 'https://wa.me/628123456789' },
  { image: '/images/background5.jpeg', buttonText: 'KLAIM BONUS REFERRAL →', buttonLink: 'https://wa.me/628123456789' },
];

export const PromoTab: React.FC<PromoTabProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<PromoSlideData[]>(DEFAULT_SLIDES);
  const [slideUploadStatus, setSlideUploadStatus] = useState<{
    [key: number]: { loading?: boolean; success?: string; error?: string };
  }>({});

  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchPromoData();
  }, []);

  const fetchPromoData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await api.get<{ imageUrls?: string[]; slides?: PromoSlideData[] }>('/public/promo-image');
      if (res.success && res.data) {
        if (res.data.slides && res.data.slides.length > 0) {
          setSlides([
            res.data.slides[0] || DEFAULT_SLIDES[0],
            res.data.slides[1] || DEFAULT_SLIDES[1],
            res.data.slides[2] || DEFAULT_SLIDES[2],
            res.data.slides[3] || DEFAULT_SLIDES[3],
          ]);
        } else if (res.data.imageUrls && res.data.imageUrls.length > 0) {
          const urls = res.data.imageUrls;
          setSlides([
            { image: urls[0] || DEFAULT_SLIDES[0].image, buttonText: DEFAULT_SLIDES[0].buttonText, buttonLink: DEFAULT_SLIDES[0].buttonLink },
            { image: urls[1] || DEFAULT_SLIDES[1].image, buttonText: DEFAULT_SLIDES[1].buttonText, buttonLink: DEFAULT_SLIDES[1].buttonLink },
            { image: urls[2] || DEFAULT_SLIDES[2].image, buttonText: DEFAULT_SLIDES[2].buttonText, buttonLink: DEFAULT_SLIDES[2].buttonLink },
            { image: urls[3] || DEFAULT_SLIDES[3].image, buttonText: DEFAULT_SLIDES[3].buttonText, buttonLink: DEFAULT_SLIDES[3].buttonLink },
          ]);
        }
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memuat data promo image');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSavePromoImage = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSlides = slides.map((s) => ({
      image: s.image.trim(),
      buttonText: s.buttonText.trim() || 'KLAIM PROMO',
      buttonLink: s.buttonLink.trim() || '/membership',
    }));

    if (validSlides.some((s) => !s.image)) {
      onError('URL Gambar Promo tidak boleh ada yang kosong');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = validSlides.map((s) => s.image);
      const res = await api.put('/admin/promo-image', { imageUrls, slides: validSlides });
      if (res.success) {
        onSuccess('4 Slide Banner Promo (Gambar, Teks Tombol & Link Target) berhasil disimpan!');
      }
    } catch (err: any) {
      onError(err.message || 'Gagal memperbarui gambar promo');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slideIdx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSlideUploadStatus((prev) => ({
      ...prev,
      [slideIdx]: { loading: true },
    }));

    try {
      const { blob } = await compressAndConvertToWebP(file, 0.8, 1920);

      const reader = new FileReader();
      const base64Data = await new Promise<string>((res, rej) => {
        reader.onloadend = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      const res = await api.post<{ url: string }>('/admin/promo-upload', { image: base64Data });
      if (res.success && res.data?.url) {
        const updated = [...slides];
        updated[slideIdx] = { ...updated[slideIdx], image: res.data.url };
        setSlides(updated);
        setSlideUploadStatus((prev) => ({
          ...prev,
          [slideIdx]: { success: '✓ WebP Ready' },
        }));
      } else {
        setSlideUploadStatus((prev) => ({
          ...prev,
          [slideIdx]: { error: res.error || '❌ Gagal Upload' },
        }));
      }
    } catch (err: any) {
      setSlideUploadStatus((prev) => ({
        ...prev,
        [slideIdx]: { error: err.message || '❌ Gagal Compress' },
      }));
    } finally {
      setUploading(false);
    }
  };

  const updateSlideField = (slideIdx: number, field: keyof PromoSlideData, value: string) => {
    const updated = [...slides];
    updated[slideIdx] = { ...updated[slideIdx], [field]: value };
    setSlides(updated);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
      <div className="bg-brand-cyan px-5 py-3 text-white font-bold flex items-center justify-between select-none">
        <h3 className="text-sm font-extrabold uppercase tracking-wider font-heading flex items-center gap-2 text-white">
          <ImageIcon size={18} />
          <span>Kelola 4 Card Slide Banner Promo Landing Page</span>
        </h3>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <p className="text-xs text-slate-500 font-body">
          Atur 4 card promo yang tampil pada carousel landing page. Setiap card memiliki <strong>Gambar Background</strong>, <strong>Teks Tombol Action</strong>, dan <strong>Link Href Tujuan</strong> (seperti <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/membership</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">https://wa.me/...</code>).
        </p>

        <form onSubmit={handleSavePromoImage} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#17A2B8] uppercase">Card Slide {idx + 1}</span>
                    {slideUploadStatus[idx]?.loading ? (
                      <span className="text-[10px] font-bold text-[#17A2B8] bg-teal-50 px-2 py-0.5 rounded border border-teal-200 animate-pulse">
                        ⏳ Compressing...
                      </span>
                    ) : slideUploadStatus[idx]?.error ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        {slideUploadStatus[idx]?.error}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {slideUploadStatus[idx]?.success || '⚡ WebP Ready'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Image URL & Upload */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        URL Gambar Slide {idx + 1}
                      </label>
                      <input
                        type="text"
                        required
                        value={slides[idx]?.image || ''}
                        onChange={(e) => updateSlideField(idx, 'image', e.target.value)}
                        placeholder={`/images/promo-slide-${idx + 1}.webp`}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-mono font-semibold"
                      />

                      <label className="mt-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 w-full border border-slate-300 transition-colors">
                        <Upload size={14} />
                        <span>{uploading ? 'Compressing...' : 'Upload & Compress WebP'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePromoFileUpload(e, idx)}
                          disabled={uploading}
                        />
                      </label>
                    </div>

                    {/* Button Text */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                        <Type size={12} />
                        <span>Teks Tombol</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={slides[idx]?.buttonText || ''}
                        onChange={(e) => updateSlideField(idx, 'buttonText', e.target.value)}
                        placeholder="KLAIM PROMO SEKARANG →"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-semibold"
                      />
                    </div>

                    {/* Button Link Href */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                        <LinkIcon size={12} />
                        <span>Link Target (Href)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={slides[idx]?.buttonLink || ''}
                        onChange={(e) => updateSlideField(idx, 'buttonLink', e.target.value)}
                        placeholder="/membership atau https://wa.me/..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-cyan font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Thumbnail Preview Box */}
                <div className="space-y-1 pt-2 border-t border-slate-200/80">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Preview Slide {idx + 1}</span>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                    {slides[idx]?.image ? (
                      <img src={slides[idx].image} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-xs">Belum ada gambar</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan hover:bg-[#138496] text-white rounded-lg font-bold text-xs uppercase shadow-sm transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>{loading ? 'Menyimpan...' : 'Simpan 4 Card Banner Promo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
