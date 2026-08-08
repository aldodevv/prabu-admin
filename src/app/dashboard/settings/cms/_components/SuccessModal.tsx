import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  message: string | null;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-5 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle size={36} />
        </div>
        <div>
          <h4 className="font-heading text-lg font-bold text-slate-800 uppercase tracking-wide">
            PROSES BERHASIL!
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-brand-cyan hover:bg-[#138496] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
        >
          OK, MENGERTI
        </button>
      </div>
    </div>
  );
};
