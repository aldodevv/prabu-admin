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

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${member.username}`;

      const [b64Logo, b64Qr] = await Promise.all([
        toDataURL(logoUrl),
        toDataURL(qrUrl),
      ]);

      if (isMounted) {
        if (b64Logo.startsWith('data:')) setLogoDataUrl(b64Logo);
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
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${member.username}`;

      // Convert images to Base64 if not already cached
      const [b64Logo, b64Qr] = await Promise.all([
        logoDataUrl ? Promise.resolve(logoDataUrl) : toDataURL(logoUrl),
        qrDataUrl ? Promise.resolve(qrDataUrl) : toDataURL(qrUrl),
      ]);

      if (b64Logo.startsWith('data:')) setLogoDataUrl(b64Logo);
      if (b64Qr.startsWith('data:')) setQrDataUrl(b64Qr);

      // Brief delay to allow React state to settle
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: false,
        pixelRatio: 3,
        backgroundColor: '#EBEBEB',
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
      {/* Visual Digital Membership Card DOM Container (Instagram Ratio 9:16) */}
      <div
        ref={cardRef}
        style={{
          backgroundColor: '#EBEBEB',
        }}
        className="w-90 h-175 p-5 flex flex-col justify-between items-center relative overflow-hidden select-none font-sans"
      >
        {/* Main Inner Card (White Container with Geometric Faceted Header) */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 relative flex flex-col items-center justify-between pt-6 overflow-hidden flex-1 mb-2">
          {/* Low-Poly Geometric Facet Header Background with Angled V-Cutout Accent */}
          <div className="absolute top-0 inset-x-0 h-50 pointer-events-none z-0 overflow-hidden rounded-t-3xl">
            <svg className="w-full h-full" viewBox="0 0 360 220" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Geometric Low-Poly Facet Triangles (Shades of Light Grey & Off-White) */}
              <polygon points="0,0 90,0 45,45" fill="#F1F5F9" />
              <polygon points="90,0 180,0 135,50" fill="#E2E8F0" opacity="0.9" />
              <polygon points="180,0 270,0 225,45" fill="#F8FAFC" />
              <polygon points="270,0 360,0 315,55" fill="#EDF2F7" />

              <polygon points="0,0 45,45 0,90" fill="#E2E8F0" opacity="0.8" />
              <polygon points="45,45 135,50 90,95" fill="#CBD5E1" opacity="0.45" />
              <polygon points="135,50 225,45 180,100" fill="#F1F5F9" opacity="0.9" />
              <polygon points="225,45 315,55 270,105" fill="#E2E8F0" opacity="0.7" />
              <polygon points="315,55 360,0 360,85" fill="#F8FAFC" />

              <polygon points="0,90 90,95 45,145" fill="#F8FAFC" opacity="0.8" />
              <polygon points="90,95 180,100 135,150" fill="#E2E8F0" opacity="0.6" />
              <polygon points="180,100 270,105 225,150" fill="#CBD5E1" opacity="0.4" />
              <polygon points="270,105 360,85 315,155" fill="#F1F5F9" opacity="0.9" />
              <polygon points="360,85 360,165 315,155" fill="#E2E8F0" opacity="0.7" />

              {/* Angled White V-Chevron Cutout Transition into Pure White Card Body */}
            </svg>
          </div>

          {/* Logo Header */}
          <div className="relative z-10 pt-2 flex flex-col items-center justify-center w-full">
            <img
              src={logoDataUrl || '/logo-transparent.png'}
              alt="PrabuGym Logo"
              className="h-35 w-auto object-contain relative z-10 drop-shadow-xs"
              crossOrigin="anonymous"
            />
          </div>

          {/* Card Title (Aggressive Gym Font - Bebas Neue) */}
          <h2 className="relative z-10 text-4xl font-normal uppercase text-slate-950 font-['Bebas_Neue','Oswald',sans-serif] leading-none my-1 text-center">
            MEMBERSHIP CARD
          </h2>

          {/* QR Code Box */}
          <div className="w-56 h-56 bg-white rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center justify-center my-1">
            <img
              src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${member.username}`}
              alt={`QR Code ${member.username}`}
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>

          {/* Member Code Bar (Bold Athletic Font - Oswald) */}
          <div className="w-full bg-slate-950 text-white py-3 px-4 rounded-b-3xl text-center font-['Oswald','monospace',sans-serif] font-extrabold text-xl shadow-sm mt-3">
            {formattedCode}
          </div>
        </div>

        {/* Card Footer Section (Outside white card on #EBEBEB canvas) */}
        <div className="w-full flex flex-col items-center text-center space-y-1.5 pt-1 pb-1">
          {/* Brand Name (Bebas Neue Athletic Brand Header) */}
          <h3 className="font-['Bebas_Neue','Oswald',sans-serif] text-xl font-normal uppercase tracking-[0.2em] text-slate-950 leading-none">
            PRABU GYM
          </h3>

          {/* Social Media & WhatsApp Contact Row */}
          <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-900 font-['Oswald',sans-serif] tracking-wide whitespace-nowrap">
            <span className="flex items-center gap-1">
              <InstagramIcon className="w-3 h-3 text-slate-950" />
              <span>@prabugym.official</span>
            </span>
            <span className="flex items-center gap-1">
              <WhatsAppIcon className="w-3 h-3 text-slate-950" />
              <span>+62 851-5888-9050</span>
            </span>
          </div>

          {/* Branch Address Line with Side Accents */}
          <div className="w-full flex items-center gap-2 pt-1 px-1">
            <div className="h-px bg-slate-400 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-950 font-['Oswald',sans-serif] text-center leading-tight whitespace-nowrap">
              {address}
            </span>
            <div className="h-px bg-slate-400 flex-1" />
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
          className="w-full py-2.5 px-4 bg-brand-cyan hover:bg-[#138496] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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

