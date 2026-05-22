import React from 'react';
import Link from 'next/link';
import { WashingMachine, Search, ShieldCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import TrackingSearch from '@/components/ui/TrackingSearch';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-light-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-slate-100/80 bg-white/60 px-6 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <AppLogo iconSize={36} textSize="text-2xl" lightBg={true} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 px-6 py-16 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black text-navy-dark md:text-6xl tracking-tight leading-none">
            Lacak Cucian Anda Tanpa Ragu.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-text-muted leading-relaxed">

            Masukkan kode resi laundry Anda di bawah untuk memantau status cucian, estimasi selesai, dan status pembayaran dari mana saja.
          </p>

          {/* Tracking Search Card */}
          <TrackingSearch />
        </div>
      </section>


      {/* Process / Steps Section */}
      <section className="border-t border-border-brand bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-navy-dark md:text-3xl">Cara Kerja Bilasin</h3>
            <p className="mt-2 text-sm text-text-muted">Proses laundry praktis dan transparan dari awal hingga pakaian siap digunakan.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-4">
                <WashingMachine size={24} />
              </div>
              <h4 className="text-base font-bold text-navy-dark">1. Antar Cucian</h4>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                Bawa cucian Anda ke outlet kami. Petugas akan menimbang dan mencatat pesanan Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-4">
                <Clock size={24} />
              </div>
              <h4 className="text-base font-bold text-navy-dark">2. Dapatkan Kode Resi</h4>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                Terima nota struk fisik or digital yang memuat kode pelacakan unik Anda.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-4">
                <Search size={24} />
              </div>
              <h4 className="text-base font-bold text-navy-dark">3. Pantau Online</h4>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                Buka web Bilasin kapan saja untuk memantau sisa waktu pengerjaan laundry Anda.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-bg text-emerald-brand border border-border-brand shadow-xs mb-4">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-navy-dark">4. Pakaian Siap</h4>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                Setelah status berubah menjadi &quot;Siap Diambil&quot;, Anda bisa mengambil cucian Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-brand bg-light-bg py-8 px-6 text-center text-xs text-text-muted">
        <p>© {new Date().getFullYear()} Bilasin. All rights reserved.</p>
        <p className="mt-1">Didesain khusus untuk pengelolaan laundry yang cerdas, cepat, dan transparan.</p>
      </footer>

    </div>
  );
}
