'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MainModeContextType {
  isMainMode: boolean;
  toggleMainMode: () => void;
}

const MainModeContext = createContext<MainModeContextType>({
  isMainMode: false,
  toggleMainMode: () => {},
});

export function MainModeProvider({ children }: { children: React.ReactNode }) {
  const [isMainMode, setIsMainMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('prabu_main_mode') === 'true' ||
        localStorage.getItem('prabu_prod_mode') === 'true' ||
        localStorage.getItem('prabu_pajak_mode') === 'true';
      setIsMainMode(saved);
    }
  }, []);

  const toggleMainMode = () => {
    setIsMainMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('prabu_main_mode', String(next));
        localStorage.setItem('prabu_pajak_mode', String(next));
        localStorage.setItem('prabu_prod_mode', String(next));
      }
      const msg = next
        ? '🔒 Mode Pajak Aktif! Menghubungkan ke Database Pajak & memuat ulang...'
        : '🏠 Mode Normal Aktif! Menghubungkan ke Database Utama & memuat ulang...';
      setToastMessage(msg);
      
      // Auto-reload after a brief moment so user sees the transition toast
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 500);

      return next;
    });
  };

  // Complex Keyboard Shortcut Listener: Ctrl + Alt + Shift + P (or Cmd + Alt + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const isKeyP = e.code === 'KeyP' || (typeof e.key === 'string' && e.key.toLowerCase() === 'p');

      if (isCmdOrCtrl && isAlt && isShift && isKeyP) {
        e.preventDefault();
        toggleMainMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MainModeContext.Provider value={{ isMainMode, toggleMainMode }}>
      {children}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white border border-amber-500/50 shadow-2xl rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-3 animate-slide-down">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </MainModeContext.Provider>
  );
}

export const useMainMode = () => useContext(MainModeContext);

// Aliases for backward compatibility
export const useProductionMode = () => {
  const { isMainMode, toggleMainMode } = useMainMode();
  return { isProductionMode: isMainMode, toggleProductionMode: toggleMainMode };
};

export const usePajakMode = () => {
  const { isMainMode, toggleMainMode } = useMainMode();
  return { isPajakMode: isMainMode, togglePajakMode: toggleMainMode };
};
