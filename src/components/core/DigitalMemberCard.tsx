'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Mail, Check, Copy } from 'lucide-react';

export interface DigitalMemberCardProps {
  member: {
    username: string;
    full_name: string;
    email?: string;
    phone?: string;
    membership_type?: string;
    membership_start?: string;
    membership_end?: string;
  };
  branchCodeOrName?: string;
  branchName?: string;
}

export function getBranchAddress(branchCodeOrName?: string): string {
  if (!branchCodeOrName) return 'JALAN GROGOL RAYA NO. 42, GROGOL-DEPOK';
  const upper = branchCodeOrName.toUpperCase();
  if (upper.includes('PITARA') || upper.includes('PANCORAN')) {
    return 'JALAN PITARA RAYA NO. 89, PITARA-DEPOK';
  }
  if (upper.includes('LIMO')) {
    return 'JALAN LIMO RAYA NO. 112, LIMO-DEPOK';
  }
  return 'JALAN GROGOL RAYA NO. 42, GROGOL-DEPOK';
}

const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop';

async function toDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Gagal mengubah URL gambar ke base64:', url, err);
    return url;
  }
}

export function DigitalMemberCard({ member, branchCodeOrName, branchName }: DigitalMemberCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const address = getBranchAddress(branchCodeOrName || branchName);

  // Format username with spaces for card display e.g. 1 6 7 1 6 2 8 1 0
  const formattedCode = (member.username || '').split('').join(' ');

  // Preload image assets as Base64 to ensure 100% reliable canvas rendering
  useEffect(() => {
    let isMounted = true;

    async function preloadImages() {
      if (typeof window === 'undefined') return;
      const origin = window.location.origin;
      const logoUrl = `${origin}/logo-transparent.png`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${member.username}`;

      const [b64Logo, b64Bg, b64Qr] = await Promise.all([
        toDataURL(logoUrl),
        toDataURL(BG_IMAGE_URL),
        toDataURL(qrUrl),
      ]);

      if (isMounted) {
        if (b64Logo.startsWith('data:')) setLogoDataUrl(b64Logo);
        if (b64Bg.startsWith('data:')) setBgDataUrl(b64Bg);
        if (b64Qr.startsWith('data:')) setQrDataUrl(b64Qr);
      }
    }

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, [member.username]);

  // Download Card as PNG Image using html-to-image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const logoUrl = `${origin}/logo-transparent.png`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${member.username}`;

      // Convert images to Base64 if not already cached
      const [b64Logo, b64Bg, b64Qr] = await Promise.all([
        logoDataUrl ? Promise.resolve(logoDataUrl) : toDataURL(logoUrl),
        bgDataUrl ? Promise.resolve(bgDataUrl) : toDataURL(BG_IMAGE_URL),
        qrDataUrl ? Promise.resolve(qrDataUrl) : toDataURL(qrUrl),
      ]);

      if (b64Logo.startsWith('data:')) setLogoDataUrl(b64Logo);
      if (b64Bg.startsWith('data:')) setBgDataUrl(b64Bg);
      if (b64Qr.startsWith('data:')) setQrDataUrl(b64Qr);

      // Brief delay to allow React state to settle
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: false,
        pixelRatio: 3,
        backgroundColor: '#0f172a',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Kartu_Member_${member.full_name.replace(/\s+/g, '_')}_${member.username}.png`;
      link.click();
    } catch (err) {
      console.error('Gagal mengunduh kartu member:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Pre-filled Email Template with explicit CRLF (\r\n) for email clients
  const emailSubject = encodeURIComponent(`Kartu Keanggotaan Digital PrabuGym - ${member.full_name}`);
  
  const emailBodyRaw = 
    `Halo ${member.full_name},\r\n\r\n` +
    `Selamat bergabung di PrabuGym! Berikut adalah rincian keanggotaan digital Anda:\r\n\r\n` +
    `• Nama Lengkap: ${member.full_name}\r\n` +
    `• Nomor Anggota: ${member.username}\r\n` +
    `• Cabang Gym: ${branchName || 'PrabuGym'}\r\n` +
    `• Paket Membership: ${member.membership_type || 'Membership'}\r\n` +
    `• Masa Aktif: ${member.membership_start || '-'} s/d ${member.membership_end || '-'}\r\n\r\n` +
    `Alamat Cabang:\r\n` +
    `${address}\r\n\r\n` +
    `*Catatan: Silakan lampirkan foto Kartu Member Digital (PNG) yang telah di-download pada email ini untuk kemudahan absensi.*\r\n\r\n` +
    `Salam Sehat,\r\n` +
    `PrabuGym Official`;

  const mailtoUrl = `mailto:${member.email || ''}?subject=${emailSubject}&body=${encodeURIComponent(emailBodyRaw)}`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(emailBodyRaw);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      {/* Visual Digital Membership Card DOM Container */}
      <div
        ref={cardRef}
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.75)), url('${bgDataUrl || BG_IMAGE_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: '#334155',
        }}
        className="w-[350px] p-5 rounded-3xl shadow-2xl text-white font-sans border border-slate-700 relative overflow-hidden select-none"
      >
        {/* Card Main Inner Container */}
        <div
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 relative flex flex-col items-center gap-5"
        >
          {/* Subtle Top Polygonal Pattern Background Header */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-100/90 to-transparent pointer-events-none rounded-t-2xl" />

          {/* Logo Header */}
          <div className="relative z-10 pt-1 flex flex-col items-center">
            <img
              src={logoDataUrl || '/logo-transparent.png'}
              alt="PrabuGym Logo"
              className="h-16 w-auto object-contain drop-shadow-xs"
              crossOrigin="anonymous"
            />
          </div>

          {/* Card Title */}
          <h2
            style={{ color: '#0f172a' }}
            className="text-xl font-extrabold tracking-wider uppercase text-slate-900 font-heading -mt-1"
          >
            MEMBERSHIP CARD
          </h2>

          {/* QR Code Container */}
          <div
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            className="w-52 h-52 bg-white rounded-2xl p-3 shadow-md border border-slate-200/80 flex items-center justify-center"
          >
            <img
              src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${member.username}`}
              alt={`QR Code ${member.username}`}
              className="w-full h-full object-contain rounded-lg"
              crossOrigin="anonymous"
            />
          </div>

          {/* Member Code Bar */}
          <div
            style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}
            className="w-full bg-[#1E1E1E] text-white py-2.5 px-4 rounded-xl text-center font-mono font-bold tracking-[0.25em] text-base shadow-sm"
          >
            {formattedCode}
          </div>
        </div>

        {/* Card Footer Section */}
        <div className="mt-4 flex flex-col items-center text-center space-y-2">
          <h3
            style={{ color: '#ffffff' }}
            className="font-extrabold text-sm uppercase tracking-widest text-white font-heading drop-shadow-md"
          >
            PRABU GYM
          </h3>

          {/* Social Media & Contact */}
          <div
            style={{ color: '#f8fafc' }}
            className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-50 whitespace-nowrap drop-shadow-xs"
          >
            <span>📷 @prabugym.official</span>
            <span>💬 +62 851-5888-9050</span>
          </div>

          {/* Branch Address Line with Side Accents */}
          <div className="w-full flex items-center gap-2 pt-1">
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }} className="h-[1px] bg-white/40 flex-1" />
            <span
              style={{ color: '#ffffff' }}
              className="text-[9px] font-extrabold uppercase tracking-wide text-white px-1 text-center leading-tight drop-shadow-xs"
            >
              {address}
            </span>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }} className="h-[1px] bg-white/40 flex-1" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="w-full py-2.5 px-4 bg-[#17A2B8] hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Mengunduh Gambar...' : 'Download Kartu Member (PNG)'}</span>
        </button>

        {/* Mailto Button */}
        {member.email ? (
          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-[#6C7A89] hover:bg-[#5a6673] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            <Mail className="w-4 h-4" />
            <span>Kirim Email ke Anggota ({member.email})</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={handleCopyTemplate}
            className="w-full py-2.5 px-4 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedTemplate ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedTemplate ? 'Teks Email Tersalin!' : 'Salin Template Teks Email'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
