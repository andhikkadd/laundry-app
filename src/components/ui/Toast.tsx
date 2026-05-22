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

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
          let bgColor = 'bg-white';
          let textColor = 'text-slate-800';
          let icon = <Info className="text-emerald-500" size={18} />;
          let borderColor = 'border-slate-100';

          if (toast.type === 'success') {
            bgColor = 'bg-white dark:bg-slate-900';
            textColor = 'text-slate-850 dark:text-slate-100';
            icon = <CheckCircle className="text-emerald-500" size={18} />;
            borderColor = 'border-emerald-100 dark:border-emerald-950/30';
          } else if (toast.type === 'error') {
            bgColor = 'bg-white dark:bg-slate-900';
            textColor = 'text-slate-850 dark:text-slate-100';
            icon = <AlertCircle className="text-rose-500" size={18} />;
            borderColor = 'border-rose-100 dark:border-rose-950/30';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3.5 w-full p-4 rounded-2xl border shadow-lg shadow-slate-100/40 dark:shadow-none pointer-events-auto animate-slide-in transition-all duration-300 ${bgColor} ${textColor} ${borderColor}`}
            >
              <div className="shrink-0">{icon}</div>
              <div className="flex-1 text-xs font-bold leading-normal">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
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
