'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldInfoProps {
  text: string;
  className?: string;
}

export const FieldInfo: React.FC<FieldInfoProps> = ({ text, className = '' }) => {
  const [show, setShow] = useState(false);

  return (
    <span className={`relative inline-flex items-center ml-1 z-20 ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-cyan-500 transition-colors p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-cyan-500"
        aria-label="Aturan Pengisian"
        title="Klik/Hover untuk melihat aturan pengisian"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-0 mb-1.5 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-2xl border border-slate-700 z-[9999] pointer-events-none animate-in fade-in zoom-in-95">
          <div className="font-sans leading-relaxed text-[11px] font-normal text-slate-200">
            <span className="font-semibold text-cyan-400 block mb-1">Aturan Pengisian:</span>
            {text}
          </div>
          <div className="absolute top-full left-2.5 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </span>
  );
};

export default FieldInfo;
