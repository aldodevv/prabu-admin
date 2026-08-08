'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/core/PageHeader';
import {
  Image as ImageIcon,
  CreditCard,
  Dumbbell,
  ShoppingBag,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { CMSTab } from './_components/types';
import { SuccessModal } from './_components/SuccessModal';
import { PromoTab } from './_components/PromoTab';
import { MembershipTab } from './_components/MembershipTab';
import { PtPlansTab } from './_components/PtPlansTab';
import { HubTab } from './_components/HubTab';

export default function CMSManagementPage() {
  const [activeTab, setActiveTab] = useState<CMSTab>('promo');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hubStep, setHubStep] = useState<'list' | 'create' | 'edit'>('list');
  const [hubCreateTrigger, setHubCreateTrigger] = useState(0);

  const handleTabChange = (tab: CMSTab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'hub') {
      setHubStep('list');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CONTENT MANAGEMENT SYSTEM (CMS)"
        description="PENGATURAN BANNER PROMO, PAKET MEMBERSHIP, PAKET PERSONAL TRAINER, DAN PRABU HUB STORE"
        action={
          activeTab === 'hub' && hubStep === 'list' ? (
            <button
              onClick={() => setHubCreateTrigger((prev) => prev + 1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-cyan text-white rounded-lg font-bold text-xs uppercase hover:bg-[#138496] transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Hub Card Baru</span>
            </button>
          ) : null
        }
      />

      {/* ALERT NOTIFICATIONS */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider animate-fadeIn flex justify-between items-center rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 font-bold text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SUCCESS MODAL POPUP */}
      <SuccessModal message={success} onClose={() => setSuccess(null)} />

      {/* TOP NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-3">
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
              onClick={() => handleTabChange(tab.id as CMSTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${isActive
                ? 'bg-brand-cyan text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT COMPONENTS */}
      {activeTab === 'promo' && (
        <PromoTab onSuccess={setSuccess} onError={setError} />
      )}
      {activeTab === 'membership' && (
        <MembershipTab onSuccess={setSuccess} onError={setError} />
      )}
      {activeTab === 'pt' && (
        <PtPlansTab onSuccess={setSuccess} onError={setError} />
      )}
      {activeTab === 'hub' && (
        <HubTab
          onSuccess={setSuccess}
          onError={setError}
          hubStep={hubStep}
          setHubStep={setHubStep}
          createTrigger={hubCreateTrigger}
        />
      )}
    </div>
  );
}
