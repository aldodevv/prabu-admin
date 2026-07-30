'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface FetchErrorAlertProps {
  error: string | null | undefined;
  featureName?: string;
  onRetry?: () => void;
  phoneNumber?: string;
  className?: string;
}

export function FetchErrorAlert({
  error,
  featureName = 'Fitur Sistem',
  onRetry,
  phoneNumber = '65877321239611',
  className = '',
}: FetchErrorAlertProps) {
  const { user, activeBranchID, branches } = useAuth();
  const activeBranch = branches.find((b) => b.id === activeBranchID);

  if (!error) return null;

  const handleWhatsAppClick = () => {
    const timeStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const branchInfo = activeBranch ? `${activeBranch.name} (${activeBranch.code})` : 'Cabang Utama';
    const userInfo = user ? `${user.username} - Role: ${user.role}` : 'User';

    const textMessage = [
      `⚠️ *[LAPORAN ERROR SYSTEM PRABU GYM]*`,
      ``,
      `📍 *Fitur:* ${featureName}`,
      `🏢 *Cabang:* ${branchInfo}`,
      `👤 *User:* ${userInfo}`,
      `🕒 *Waktu:* ${timeStr}`,
      ``,
      `🚨 *Detail Error:*`,
      `\`\`\`${error}\`\`\``,
      ``,
      `Mohon dibantu perbaikannya, terima kasih 🙏`,
    ].join('\n');

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-red-50/90 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <h4 className="font-bold text-red-900 uppercase tracking-wider text-[11px] mb-1">
            Gagal Memuat Data — {featureName}
          </h4>
          <p className="text-red-700 font-medium leading-relaxed font-mono bg-red-100/60 px-2.5 py-1.5 rounded border border-red-200 break-words">
            {error}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Muat Ulang</span>
          </button>
        )}

        <button
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-all hover:scale-105"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Lapor Error ke WhatsApp (65877321239611)</span>
        </button>
      </div>
    </div>
  );
}
