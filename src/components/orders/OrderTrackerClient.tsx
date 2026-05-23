'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, BadgeDollarSign, HeartHandshake, CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import StatusBadge from '@/components/ui/StatusBadge';
import OrderTimeline from '@/components/orders/OrderTimeline';
import { getTrackingData, getMidtransTokenForOrder, markPaymentAsPaid } from '@/actions/orders';
import { formatPrice, formatDateTime, getRemainingTimeText } from '@/lib/format';
import { OrderStatus } from '@prisma/client';
import { useToast } from '@/components/ui/Toast';

interface OrderTrackerClientProps {
  orderCode: string;
  initialOrder: any;
  initialQueuePosition: number;
  midtransClientKey: string;
  isProduction: boolean;
}

export default function OrderTrackerClient({
  orderCode,
  initialOrder,
  initialQueuePosition,
  midtransClientKey,
  isProduction,
}: OrderTrackerClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const [queuePosition, setQueuePosition] = useState(initialQueuePosition);
  const [isPaying, setIsPaying] = useState(false);
  const { showToast } = useToast();

  // Load Midtrans Snap client-side library (optional, only if configured)
  useEffect(() => {
    if (!midtransClientKey) return; // Skip if Midtrans is not configured

    try {
      const snapUrl = isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
        
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', midtransClientKey);
      script.async = true;
      script.onerror = () => {
        console.warn('Midtrans Snap SDK failed to load.');
      };
      document.body.appendChild(script);

      return () => {
        try { document.body.removeChild(script); } catch {}
      };
    } catch {
      console.warn('Failed to initialize Midtrans Snap.');
    }
  }, [midtransClientKey, isProduction]);

  const handleOnlinePayment = async () => {
    setIsPaying(true);
    try {
      const res = await getMidtransTokenForOrder(order.orderCode);
      if (res.error) {
        showToast(res.error, 'error');
        setIsPaying(false);
        return;
      }

      if (res.alreadyPaid) {
        setOrder((prev: any) => ({ ...prev, paymentStatus: 'PAID' }));
        setIsPaying(false);
        return;
      }

      const snap = (window as any).snap;
      if (snap && res.midtransToken) {
        snap.pay(res.midtransToken, {
          onSuccess: async (result: any) => {
            console.log('Payment success:', result);
            
            // Manual local override for testing environments without webhooks
            try {
              let method = order.paymentMethod;
              if (result.payment_type === 'bank_transfer' || result.payment_type === 'echannel') {
                 method = 'TRANSFER';
              } else if (result.payment_type === 'qris') {
                 method = 'QRIS';
              }
              await markPaymentAsPaid(order.id, method);
            } catch (e) {
              console.error('Failed to update DB payment status locally:', e);
            }

            setOrder((prev: any) => ({ ...prev, paymentStatus: 'PAID' }));
            setIsPaying(false);
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            setIsPaying(false);
          },
          onError: (result: any) => {
            console.error('Payment error:', result);
            showToast('Pembayaran gagal atau dibatalkan. Silakan coba lagi.', 'error');
            setIsPaying(false);
          },
          onClose: () => {
            console.log('Payment modal closed');
            showToast('Anda menutup jendela pembayaran.', 'info');
            setIsPaying(false);
          }
        });
      } else if (res.midtransRedirectUrl) {
        window.location.href = res.midtransRedirectUrl;
      } else {
        showToast('Kunci klien Midtrans belum terpasang atau skrip Snap belum termuat.', 'error');
        setIsPaying(false);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      showToast('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
      setIsPaying(false);
    }
  };

  // Polling for real-time status updates every 4 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getTrackingData(orderCode);
        if (data && data.order) {
          setOrder(data.order);
          setQueuePosition(data.queuePosition);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderCode]);

  const remainingTimeText = getRemainingTimeText(order.estimatedEndAt, order.status);
  
  const isCashlessUnpaid = 
    (order.paymentMethod === 'QRIS' || order.paymentMethod === 'TRANSFER' || order.paymentMethod === 'EWALLET') && 
    order.paymentStatus === 'UNPAID' && 
    order.status !== OrderStatus.CANCELLED;

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

  const isCurrentCashlessUnpaid =
    (order.paymentMethod === 'QRIS' ||
      order.paymentMethod === 'TRANSFER' ||
      order.paymentMethod === 'EWALLET') &&
    order.paymentStatus === 'UNPAID' &&
    order.status !== OrderStatus.CANCELLED;

  const steps = [
    {
      label: 'Antre',
      desc: isCurrentCashlessUnpaid
        ? 'Menunggu Pembayaran'
        : queuePosition > 0
        ? `Antrean ke-${queuePosition}`
        : 'Menunggu pengerjaan',
    },
    { label: 'Proses', desc: order.machineNumber ? `Mesin #${order.machineNumber}` : 'Sedang dicuci/setrika' },
    { label: 'Siap', desc: 'Selesai & siap diambil' },
    { label: 'Selesai', desc: 'Sudah diserahkan' },
  ];

  // Helper for dynamic status styling & custom copy
  const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED:
        if (isCurrentCashlessUnpaid) {
          return {
            bg: 'bg-amber-50/80 border-amber-200/60 text-amber-900',
            borderAccent: 'border-l-4 border-l-amber-500',
            icon: '💳',
            title: 'Menunggu Pembayaran',
            desc: 'Selesaikan pembayaran online Anda agar pesanan laundry Anda dapat masuk ke dalam antrean pengerjaan outlet kami.',
            colorClass: 'text-amber-600',
          };
        }
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
          desc: 'Pesanan laundry ini telah dibatalkan oleh pihak outlet. Staf kami membatalkan pesanan ini, silakan hubungi admin kami untuk informasi lebih lanjut.',
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
      <main className="flex-1 px-4 py-4 md:py-8">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
          
          {/* Tracking Status Card */}
          <div className="rounded-2xl border border-border-brand bg-white p-4 sm:p-6 shadow-xs relative overflow-hidden">
            {/* Soft decorative header glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  KODE PELACAKAN RESI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-navy-dark tracking-tight mt-0.5">
                  {order.orderCode}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Nama Pelanggan: <span className="font-bold text-text-dark">{order.customer.name}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 self-start sm:self-center">
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Dynamic Status Alert Message (Custom styled left accent border) */}
            <div className={`mt-5 md:mt-8 rounded-xl border p-3.5 sm:p-4.5 shadow-xs flex gap-3 items-start ${statusMeta.bg} ${statusMeta.borderAccent}`}>
              <span className="text-xl sm:text-2xl leading-none select-none mt-0.5">{statusMeta.icon}</span>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-navy-dark tracking-tight">{statusMeta.title}</h4>
                <p className="text-[11px] text-text-dark leading-relaxed font-medium">
                  {statusMeta.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          {!isCashlessUnpaid ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Remaining Time Box */}
              <div className="rounded-xl border border-border-brand bg-white p-4 sm:p-5 shadow-xs text-center flex flex-col justify-center items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2">
                  <Clock size={16} className="text-emerald-brand" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Sisa Waktu Pengerjaan</span>
                <span className="mt-1 text-xs sm:text-sm font-extrabold text-navy-dark">
                  {remainingTimeText}
                </span>
              </div>

              {/* Estimated Finish Date */}
              <div className="rounded-xl border border-border-brand bg-white p-4 sm:p-5 shadow-xs text-center flex flex-col justify-center items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2">
                  <Calendar size={16} className="text-emerald-brand" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Estimasi Selesai</span>
                <span className="mt-1 text-[10px] sm:text-[11px] font-bold text-navy-dark leading-tight">
                  {formatDateTime(order.estimatedEndAt)}
                </span>
              </div>

              {/* Queue Number Box */}
              <div className="rounded-xl border border-border-brand bg-white p-4 sm:p-5 shadow-xs text-center flex flex-col justify-center items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-light-bg text-navy-dark border border-border-brand mb-2">
                  <BadgeDollarSign size={16} className="text-emerald-brand" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Nomor Antrean Kerja</span>
                <span className="mt-0.5 text-lg sm:text-xl font-black text-emerald-brand">
                  #{order.queueNumber.toString().padStart(3, '0')}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs flex flex-col justify-center items-center text-center space-y-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-1">
                <Clock size={20} className="text-amber-600" />
              </div>
              <span className="text-sm font-bold text-amber-800">
                Menunggu Pembayaran
              </span>
              <span className="text-xs font-semibold text-amber-700/80">
                Pesanan akan masuk ke estimasi antrean kerja setelah pembayaran QRIS diselesaikan.
              </span>
            </div>
          )}


          {/* Timeline and Details section */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-5">
            {/* Timeline */}
            <div className="rounded-2xl border border-border-brand bg-white p-4 sm:p-6 shadow-xs md:col-span-3">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider mb-4 md:mb-6 border-b border-slate-100 pb-2">
                Status Log Perjalanan
              </h3>
              <OrderTimeline currentStatus={order.status} logs={order.statusLogs} />
            </div>

            {/* Detailed summary */}
            <div className="rounded-2xl border border-border-brand bg-white p-4 sm:p-6 shadow-xs md:col-span-2 space-y-4 h-fit">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
                Rincian Nota Belanja
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Layanan Paket</span>
                  <span className="font-bold text-text-dark">{order.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Timbangan</span>
                  <span className="font-bold text-text-dark">
                    {order.weightKg} {order.service.unit === 'ITEM' ? 'item' : 'kg'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">
                    Tarif / {order.service.unit === 'ITEM' ? 'Item' : 'Kg'}
                  </span>
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

                {/* Secure Payment Status Section & Midtrans Dynamic Pay Button */}
                {order.paymentStatus === 'PAID' ? (
                  <div className="border-t border-border-brand pt-4 mt-2">
                    <span className="text-text-muted font-bold block mb-1">Status Pembayaran:</span>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/50">
                      <CheckCircle2 size={15} className="text-emerald-brand" />
                      <span>Dibayar</span>
                    </div>
                  </div>
                ) : (
                  order.status !== OrderStatus.CANCELLED && (
                    <div className="border-t border-border-brand pt-4 mt-2 space-y-3">
                      <span className="text-text-muted font-bold block">Status Pembayaran:</span>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 p-2.5 rounded-lg border border-amber-200/50">
                        <span>⚠️ Belum Bayar</span>
                      </div>

                      <button
                        onClick={handleOnlinePayment}
                        disabled={isPaying}
                        className="w-full bg-emerald-brand text-white font-extrabold rounded-xl py-3 shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                      >
                        {isPaying ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Memproses Pembayaran...
                          </>
                        ) : (
                          <>
                            <QrCode size={16} />
                            Bayar Sekarang (QRIS / VA)
                          </>
                        )}
                      </button>



                      <div className="flex justify-center items-center gap-2 pt-1 opacity-70">
                        <span className="text-[9px] text-text-muted font-bold">Securely processed by</span>
                        <span className="text-[10px] font-black text-navy-dark tracking-tight">midtrans</span>
                      </div>
                    </div>
                  )
                )}
                
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
