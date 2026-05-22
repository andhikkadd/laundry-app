import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, BadgeDollarSign, HeartHandshake, CheckCircle2 } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import StatusBadge from '@/components/ui/StatusBadge';
import PaymentBadge from '@/components/ui/PaymentBadge';
import OrderTimeline from '@/components/orders/OrderTimeline';
import { getOrderByCode } from '@/actions/orders';
import { formatPrice, formatDateTime, getRemainingTimeText } from '@/lib/format';
import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface TrackDetailProps {
  params: Promise<{ orderCode: string }>;
}

export default async function TrackDetailPage({ params }: TrackDetailProps) {
  const { orderCode } = await params;
  const order = await getOrderByCode(orderCode);

  if (!order) {
    return notFound();
  }

  const remainingTimeText = getRemainingTimeText(order.estimatedEndAt, order.status);

  // Calculate position in queue for transparency
  let queuePosition = 0;
  if (order.status === OrderStatus.QUEUED) {
    const olderQueuedCount = await prisma.order.count({
      where: {
        status: OrderStatus.QUEUED,
        createdAt: { lt: order.createdAt },
      },
    });
    queuePosition = olderQueuedCount + 1;
  }

  // Helper to determine step indexes for tracking progress
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED: return 0;
      case OrderStatus.PROCESSING: return 1;
      case OrderStatus.READY: return 2;
      case OrderStatus.PICKED_UP: return 3;
      case OrderStatus.CANCELLED: return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  const steps = [
    { label: 'Antre', desc: queuePosition > 0 ? `Antrean ke-${queuePosition}` : 'Menunggu pengerjaan' },
    { label: 'Proses', desc: order.machineNumber ? `Mesin #${order.machineNumber}` : 'Sedang dicuci/setrika' },
    { label: 'Siap', desc: 'Selesai & siap diambil' },
    { label: 'Selesai', desc: 'Sudah diserahkan' },
  ];

  // Helper for dynamic status styling & custom copy
  const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED:
        return {
          bg: 'bg-amber-50/80 border-amber-200/60 text-amber-900',
          borderAccent: 'border-l-4 border-l-amber-500',
          icon: '⏳',
          title: queuePosition > 0 ? `Antrean ke-${queuePosition}` : 'Cucian Anda Sedang Mengantre',
          desc: queuePosition > 0 
            ? `Cucian Anda saat ini berada di nomor urut antrean ke-${queuePosition}. Mohon tunggu sebentar, mesin cuci kami akan segera memproses pakaian Anda.` 
            : 'Pesanan laundry Anda telah terdaftar dan berada dalam antrean pengerjaan. Tim kami akan segera memproses pakaian Anda.',
          colorClass: 'text-amber-600',
        };
      case OrderStatus.PROCESSING:
        return {
          bg: 'bg-emerald-50/80 border-emerald-200/60 text-emerald-950',
          borderAccent: 'border-l-4 border-l-emerald-500',
          icon: '🔄',
          title: order.machineNumber ? `Sedang Dicuci di Mesin ${order.machineNumber}` : 'Sedang Diproses Higienis',
          desc: order.machineNumber 
            ? `Pakaian Anda saat ini sedang diproses pencucian secara higienis di Mesin Cuci nomor ${order.machineNumber}.`
            : 'Pakaian Anda saat ini sedang dicuci, dikeringkan, atau disetrika oleh staf profesional kami dengan standar kebersihan tinggi.',
          colorClass: 'text-emerald-600',
        };
      case OrderStatus.READY:
        return {
          bg: 'bg-teal-50/90 border-teal-200/60 text-teal-950',
          borderAccent: 'border-l-4 border-l-teal-500',
          icon: '✨',
          title: 'Hore! Cucian Anda Siap Diambil',
          desc: 'Cucian Anda telah selesai disetrika rapi dan wangi! Silakan kunjungi outlet kami dan tunjukkan kode resi di atas untuk pengambilan.',
          colorClass: 'text-teal-600',
        };
      case OrderStatus.PICKED_UP:
        return {
          bg: 'bg-slate-50/80 border-slate-200/60 text-slate-900',
          borderAccent: 'border-l-4 border-l-slate-400',
          icon: '🧺',
          title: 'Pesanan Selesai & Diambil',
          desc: 'Terima kasih telah mempercayakan pakaian Anda kepada Bilasin. Sampai jumpa di pesanan laundry berikutnya!',
          colorClass: 'text-slate-600',
        };
      case OrderStatus.CANCELLED:
        return {
          bg: 'bg-rose-50/80 border-rose-200/60 text-rose-900',
          borderAccent: 'border-l-4 border-l-rose-500',
          icon: '❌',
          title: 'Pesanan Dibatalkan',
          desc: 'Pesanan laundry ini telah dibatalkan oleh pihak outlet. Silakan hubungi admin kami untuk informasi lebih lanjut.',
          colorClass: 'text-rose-600',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          borderAccent: 'border-l-4 border-l-slate-400',
          icon: '📄',
          title: 'Pesanan Terdaftar',
          desc: 'Pesanan masuk sistem.',
          colorClass: 'text-slate-500',
        };
    }
  };

  const statusMeta = getStatusDetails(order.status);

  return (
    <div className="flex min-h-screen flex-col bg-light-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border-brand bg-white px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <AppLogo iconSize={28} lightBg={true} />
          <Link
            href="/track"
            className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-navy-dark transition-colors"
          >
            <ArrowLeft size={14} />
            Lacak Resi Lain
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          
          {/* Tracking Status Card */}
          <div className="rounded-2xl border border-border-brand bg-white p-6 shadow-xs relative overflow-hidden">
            {/* Soft decorative header glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  KODE PELACAKAN RESI
                </span>
                <h2 className="text-2xl font-black text-navy-dark tracking-tight mt-0.5">
                  {order.orderCode}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Nama Pelanggan: <span className="font-bold text-text-dark">{order.customer.name}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 self-start sm:self-center">
                <StatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>

            {/* Horizontal Progress bar tracker */}
            {order.status !== OrderStatus.CANCELLED && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="relative flex justify-between items-center w-full">
                  {/* Background Track Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />
                  {/* Active Green Track Line */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-brand rounded-full transition-all duration-500 z-0" 
                    style={{ 
                      width: `${currentStepIdx >= 0 ? (currentStepIdx / (steps.length - 1)) * 100 : 0}%` 
                    }}
                  />

                  {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isActive = idx === currentStepIdx;
                    return (
                      <div key={step.label} className="flex flex-col items-center z-10 relative">
                        <div 
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 font-bold text-[11px] ${
                            isCompleted 
                              ? 'bg-emerald-brand border-emerald-brand text-white shadow-xs' 
                              : isActive 
                              ? 'bg-white border-emerald-brand text-emerald-brand ring-4 ring-emerald-50 scale-110 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={14} /> : (idx + 1)}
                        </div>
                        <span className={`text-[10px] font-bold mt-2 ${isActive ? 'text-emerald-brand' : 'text-text-dark'}`}>
                          {step.label}
                        </span>
                        <span className="text-[8px] text-text-muted hidden md:inline mt-0.5 max-w-[80px] text-center leading-tight">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Status Alert Message (Custom styled left accent border) */}
            <div className={`mt-8 rounded-xl border p-4.5 shadow-xs flex gap-3.5 items-start ${statusMeta.bg} ${statusMeta.borderAccent}`}>
              <span className="text-2xl leading-none select-none mt-0.5">{statusMeta.icon}</span>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-navy-dark tracking-tight">{statusMeta.title}</h4>
                <p className="text-[11px] text-text-dark leading-relaxed font-medium">
                  {statusMeta.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Remaining Time Box */}
            <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs text-center flex flex-col justify-center items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2.5">
                <Clock size={18} className="text-emerald-brand" />
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sisa Waktu Pengerjaan</span>
              <span className="mt-1 text-sm font-extrabold text-navy-dark">
                {remainingTimeText}
              </span>
            </div>

            {/* Estimated Finish Date */}
            <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs text-center flex flex-col justify-center items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2.5">
                <Calendar size={18} className="text-emerald-brand" />
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Estimasi Selesai</span>
              <span className="mt-1 text-[11px] font-bold text-navy-dark leading-tight">
                {formatDateTime(order.estimatedEndAt)}
              </span>
            </div>

            {/* Queue Number Box */}
            <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs text-center flex flex-col justify-center items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2.5">
                <BadgeDollarSign size={18} className="text-emerald-brand" />
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nomor Antrean Kerja</span>
              <span className="mt-0.5 text-xl font-black text-emerald-brand">
                #{order.queueNumber.toString().padStart(3, '0')}
              </span>
            </div>
          </div>

          {/* Timeline and Details section */}
          <div className="grid gap-6 md:grid-cols-5">
            {/* Timeline */}
            <div className="rounded-2xl border border-border-brand bg-white p-6 shadow-xs md:col-span-3">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">
                Status Log Perjalanan
              </h3>
              <OrderTimeline currentStatus={order.status} logs={order.statusLogs} />
            </div>

            {/* Detailed summary */}
            <div className="rounded-2xl border border-border-brand bg-white p-6 shadow-xs md:col-span-2 space-y-4 h-fit">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
                Rincian Nota Belanja
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Layanan Paket</span>
                  <span className="font-bold text-text-dark">{order.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Berat Timbangan</span>
                  <span className="font-bold text-text-dark">{order.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Tarif / Kg</span>
                  <span className="font-bold text-text-dark">{formatPrice(order.pricePerKg)}</span>
                </div>
                <div className="flex justify-between border-t border-border-brand pt-3">
                  <span className="text-navy-dark font-extrabold">Total Biaya</span>
                  <span className="font-black text-emerald-brand text-sm">{formatPrice(order.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Metode Pembayaran</span>
                  <span className="font-extrabold text-text-dark uppercase">{order.paymentMethod === 'CASH' ? 'TUNAI' : order.paymentMethod}</span>
                </div>
                
                {order.notes && (
                  <div className="border-t border-border-brand pt-3 space-y-1">
                    <span className="text-text-muted font-bold block">Catatan Pesanan:</span>
                    <p className="bg-light-bg p-2.5 rounded-lg border border-border-brand text-text-dark leading-relaxed font-medium italic">
                      &quot;{order.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center p-4">
            <p className="text-xs text-text-muted inline-flex items-center gap-1.5 justify-center font-medium">
              <HeartHandshake size={14} className="text-emerald-brand" />
              Butuh bantuan? Silakan hubungi admin outlet kami.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
