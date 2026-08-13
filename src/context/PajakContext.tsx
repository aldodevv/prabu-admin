'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PajakContextType {
  isPajakMode: boolean;
  togglePajakMode: () => void;
}

const PajakContext = createContext<PajakContextType>({
  isPajakMode: false,
  togglePajakMode: () => {},
});

export function PajakProvider({ children }: { children: React.ReactNode }) {
  const [isPajakMode, setIsPajakMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prabu_pajak_mode') === 'true';
      setIsPajakMode(saved);
    }
  }, []);

  const togglePajakMode = () => {
    setIsPajakMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('prabu_pajak_mode', String(next));
      }
      const msg = next
        ? '🔒 Easter Egg Aktif! Mode Database Pajak (URL_DB_PAJAK) diaktifkan.'
        : '🏠 Mode Normal! Kembali ke Database Utama (URL_DB / URL_DB_DEV).';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
      return next;
    });
  };

  // Complex Keyboard Shortcut Listener: Ctrl + Alt + Shift + P (or Cmd + Alt + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const isKeyP = e.code === 'KeyP' || e.key.toLowerCase() === 'p';

      if (isCmdOrCtrl && isAlt && isShift && isKeyP) {
        e.preventDefault();
        togglePajakMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PajakContext.Provider value={{ isPajakMode, togglePajakMode }}>
      {children}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white border border-amber-500/50 shadow-2xl rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-3 animate-slide-down">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </PajakContext.Provider>
  );
}

export const usePajakMode = () => useContext(PajakContext);
