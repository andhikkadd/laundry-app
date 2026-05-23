import React from 'react';
import Link from 'next/link';
import { WashingMachine, Search, ShieldCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import TrackingSearch from '@/components/ui/TrackingSearch';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-light-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 md:h-20 w-full items-center justify-between border-b border-slate-100/80 bg-white/60 px-4 md:px-6 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <AppLogo iconSize={30} textSize="text-xl md:text-2xl" lightBg={true} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 px-4 py-10 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-navy-dark tracking-tight leading-tight md:leading-none">
            Lacak Cucian Anda Tanpa Ragu.
          </h2>
          <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-xs sm:text-sm md:text-lg text-text-muted leading-relaxed">
            Masukkan kode resi laundry Anda di bawah untuk memantau status cucian, estimasi selesai, dan status pembayaran dari mana saja.
          </p>

          {/* Tracking Search Card */}
          <TrackingSearch />
        </div>
      </section>

      {/* Process / Steps Section */}
      <section className="border-t border-border-brand bg-white px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-xl font-bold text-navy-dark sm:text-2xl md:text-3xl">Cara Kerja Bilasin</h3>
            <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-text-muted">Proses laundry praktis dan transparan dari awal hingga pakaian siap digunakan.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-3">
                <WashingMachine size={22} />
              </div>
              <h4 className="text-sm font-bold text-navy-dark md:text-base">1. Antar Cucian</h4>
              <p className="mt-1.5 text-[11px] md:text-xs text-text-muted leading-relaxed">
                Bawa cucian Anda ke outlet kami. Petugas akan menimbang dan mencatat pesanan Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-3">
                <Clock size={22} />
              </div>
              <h4 className="text-sm font-bold text-navy-dark md:text-base">2. Dapatkan Kode Resi</h4>
              <p className="mt-1.5 text-[11px] md:text-xs text-text-muted leading-relaxed">
                Terima nota struk fisik or digital yang memuat kode pelacakan unik Anda.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-3">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-bold text-navy-dark md:text-base">3. Pantau Online</h4>
              <p className="mt-1.5 text-[11px] md:text-xs text-text-muted leading-relaxed">
                Buka web Bilasin kapan saja untuk memantau sisa waktu pengerjaan laundry Anda.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-3">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-sm font-bold text-navy-dark md:text-base">4. Pakaian Siap</h4>
              <p className="mt-1.5 text-[11px] md:text-xs text-text-muted leading-relaxed">
                Setelah status berubah menjadi &quot;Siap Diambil&quot;, Anda bisa mengambil cucian Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-brand bg-light-bg py-6 px-4 text-center text-[11px] md:text-xs text-text-muted">
        <p>© {new Date().getFullYear()} Bilasin. All rights reserved.</p>
        <p className="mt-1">Didesain khusus untuk pengelolaan laundry yang cerdas, cepat, dan transparan.</p>
      </footer>

    </div>
  );
}
