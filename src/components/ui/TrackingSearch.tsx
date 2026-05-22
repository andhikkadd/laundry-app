'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getOrderByCode } from '@/actions/orders';

export default function TrackingSearch() {
  const router = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode) {
      showToast('Harap masukkan kode resi Anda terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const order = await getOrderByCode(cleanCode);
      if (order) {
        router.push(`/track/${cleanCode}`);
      } else {
        showToast(`Kode resi "${cleanCode}" tidak ditemukan.`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/40">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Contoh: LDY-20260522-0001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3.5 pl-10 pr-3 text-xs font-semibold text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-brand px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50 min-w-[120px]"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Lacak Status
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
