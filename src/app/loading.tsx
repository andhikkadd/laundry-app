import React from 'react';

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
