import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex h-full w-full min-h-[50vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-3 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">
          Memuat Data...
        </p>
      </div>
    </div>
  );
}
