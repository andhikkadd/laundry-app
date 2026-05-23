'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 2.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container in top-right corner */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-[calc(100%-3rem)] max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let borderTheme = 'border-l-navy-dark bg-slate-900/95 text-white shadow-slate-950/20';
          let iconBg = 'bg-slate-800 border-slate-700';
          let icon = <Info className="text-slate-300" size={15} />;
          let textTheme = 'text-slate-100';

          if (toast.type === 'success') {
            borderTheme = 'border-l-emerald-brand bg-white/95 border-y border-r border-slate-100 shadow-emerald-250/20';
            iconBg = 'bg-emerald-50 border-emerald-100/50';
            icon = <CheckCircle className="text-emerald-brand" size={15} strokeWidth={2.5} />;
            textTheme = 'text-navy-dark';
          } else if (toast.type === 'error') {
            borderTheme = 'border-l-rose-500 bg-white/95 border-y border-r border-slate-100 shadow-rose-250/20';
            iconBg = 'bg-rose-50 border-rose-100/50';
            icon = <AlertCircle className="text-rose-500" size={15} strokeWidth={2.5} />;
            textTheme = 'text-navy-dark';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3.5 w-full p-4 rounded-xl border-l-4 backdrop-blur-md shadow-xl pointer-events-auto animate-slide-in transition-all duration-300 ${borderTheme}`}
            >
              <div className={`shrink-0 flex items-center justify-center p-1.5 rounded-xl border ${iconBg}`}>
                {icon}
              </div>
              <div className={`flex-1 text-[11px] font-bold leading-normal ${textTheme}`}>{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
