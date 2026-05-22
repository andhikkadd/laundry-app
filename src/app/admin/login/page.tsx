'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import AppLogo from '@/components/ui/AppLogo';


export default function AdminLoginPage() {

  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        showToast(res.error, 'error');
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800 p-8 shadow-2xl border border-slate-700">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <AppLogo lightText={true} iconSize={36} textSize="text-3xl" textSuffix="Admin" className="mb-4" />
          <p className="mt-2 text-sm text-slate-400">
            Masuk ke panel manajemen outlet laundry
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">


          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="block w-full rounded-xl border border-slate-750 bg-slate-900 py-3.5 pl-10 pr-3 text-sm text-white focus:border-emerald-brand focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-750 bg-slate-900 py-3.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 focus:border-emerald-brand focus:outline-hidden transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-white focus:outline-hidden cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>


          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-600 focus:outline-hidden disabled:opacity-55"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Memproses Masuk...
              </>
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Kembali ke Halaman Utama
          </Link>
        </div>

      </div>
    </div>
  );
}
