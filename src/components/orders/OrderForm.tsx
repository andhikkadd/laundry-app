'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { formatPrice } from '@/lib/format';
import { Loader2, Plus, User, Phone, WashingMachine, FileText, ShoppingBag } from 'lucide-react';

declare global {
  interface Window {
    snap: any;
  }
}

interface Service {
  id: string;
  name: string;
  slug: string;
  pricePerKg: number;
  baseDurationMinutes: number;
  durationPerKgMinutes: number;
  isExpress: boolean;
  isActive: boolean;
  unit: string;
}

interface OrderFormProps {
  services: Service[];
}

export default function OrderForm({ services }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState('');


  // Calculations state
  const [pricePerKg, setPricePerKg] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  const activeService = services.find((s) => s.id === selectedServiceId);

  // Load Midtrans Snap client-side library (optional, only if configured)
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return; // Skip if Midtrans is not configured

    try {
      const snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      script.onerror = () => {
        console.warn('Midtrans Snap script failed to load. QRIS payments may not work.');
      };
      document.body.appendChild(script);

      return () => {
        try { document.body.removeChild(script); } catch {}
      };
    } catch {
      console.warn('Failed to initialize Midtrans Snap.');
    }
  }, []);

  // Recalculate values when service or weight changes
  useEffect(() => {
    if (activeService) {
      setPricePerKg(activeService.pricePerKg);
      const w = Number(weightKg) || 0;
      setTotalPrice(w * activeService.pricePerKg);
      setEstimatedDuration(
        activeService.baseDurationMinutes + Math.round(w * activeService.durationPerKgMinutes)
      );
    } else {
      setPricePerKg(0);
      setTotalPrice(0);
      setEstimatedDuration(0);
    }
  }, [selectedServiceId, weightKg, activeService]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const w = Number(weightKg);
    if (!w || w <= 0) {
      setError(activeService?.unit === 'ITEM' ? 'Jumlah pakaian harus lebih dari 0 item' : 'Berat pakaian harus lebih dari 0 kg');
      return;
    }

    if (!selectedServiceId) {
      setError('Layanan laundry harus dipilih');
      return;
    }

    startTransition(async () => {
      const res = await createOrder({
        customerName,
        customerPhone: customerPhone || undefined,
        serviceId: selectedServiceId,
        weightKg: w,
        paymentMethod,
        notes: notes || undefined,
      });

      if (res?.error) {
        setError(res.error);
      } else if (res?.success && res.orderId) {
        // If payment is non-cash and we got a Midtrans token, trigger Snap popup
        if (
          (paymentMethod === PaymentMethod.QRIS || paymentMethod === PaymentMethod.TRANSFER) &&
          res.midtransToken
        ) {
          if (window.snap) {
            window.snap.pay(res.midtransToken, {
              onSuccess: function (result: any) {
                console.log('Midtrans Snap payment success:', result);
                router.push(`/admin/orders/${res.orderId}`);
              },
              onPending: function (result: any) {
                console.log('Midtrans Snap payment pending:', result);
                router.push(`/admin/orders/${res.orderId}`);
              },
              onError: function (result: any) {
                console.error('Midtrans Snap payment error:', result);
                setError('Pembayaran Midtrans gagal. Silakan hubungi admin.');
                router.push(`/admin/orders/${res.orderId}`);
              },
              onClose: function () {
                console.log('Midtrans Snap modal closed');
                router.push(`/admin/orders/${res.orderId}`);
              },
            });
          } else if (res.midtransRedirectUrl) {
            // Fallback if Snap JS is not loaded yet
            window.location.href = res.midtransRedirectUrl;
          } else {
            router.push(`/admin/orders/${res.orderId}`);
          }
        } else {
          // If cash or unpaid, go straight to the invoice receipt page
          router.push(`/admin/orders/${res.orderId}`);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
      {/* Form Input fields */}
      <div className="md:col-span-2 space-y-6">
        {/* Customer Information Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <User size={16} className="text-emerald-brand" />
            Informasi Pelanggan
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customerName" className="block text-xs font-semibold text-text-dark mb-1">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  id="customerName"
                  required
                  placeholder="Nama Lengkap"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 pl-9 pr-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-xs font-semibold text-text-dark mb-1">
                No. Telepon / WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  id="customerPhone"
                  placeholder="Contoh: 08123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 pl-9 pr-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Laundry details card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShoppingBag size={16} className="text-emerald-brand" />
            Detail Laundry
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Service */}
            <div className="sm:col-span-2">
              <label htmlFor="serviceId" className="block text-xs font-semibold text-text-dark mb-1">
                Layanan Paket <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <WashingMachine size={16} />
                </span>
                <select
                  id="serviceId"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 pl-9 pr-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium appearance-none transition-all duration-200"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatPrice(s.pricePerKg)}/{(s.unit || 'KG').toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weight / Qty */}
            <div>
              <label htmlFor="weightKg" className="block text-xs font-semibold text-text-dark mb-1">
                {activeService?.unit === 'ITEM' ? 'Jumlah (Pcs/Item)' : 'Berat Cucian (Kg)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step={activeService?.unit === 'ITEM' ? '1' : '0.01'}
                id="weightKg"
                required
                min={activeService?.unit === 'ITEM' ? '1' : '0.01'}
                placeholder={activeService?.unit === 'ITEM' ? '0' : '0.0'}
                value={weightKg}
                onChange={(e) => {
                  const val = e.target.value;
                  setWeightKg(val === '' ? '' : Number(val));
                }}
                className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 px-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden font-bold transition-all duration-200"
              />
            </div>
          </div>

          {/* Payment block */}
          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <label htmlFor="paymentMethod" className="block text-xs font-semibold text-text-dark mb-1">
                Metode Pembayaran
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium transition-all duration-200"
              >
                <option value={PaymentMethod.CASH}>Tunai (Cash)</option>
                <option value={PaymentMethod.QRIS}>QRIS / Cashless</option>
              </select>
            </div>
          </div>


          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-text-dark mb-1">
              Catatan Cucian
            </label>
            <div className="relative">
              <span className="absolute top-3.5 left-3 text-text-muted">
                <FileText size={16} />
              </span>
              <textarea
                id="notes"
                rows={3}
                placeholder="Contoh: kemeja putih pisahkan, pewangi ekstra, atau hanger..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3 pl-9 pr-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estimations / Bill side panel */}
      <div className="space-y-6">
        {/* Bill summary card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4 sticky top-6">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-slate-100 pb-2">
            Ringkasan Transaksi
          </h3>

          <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
            <div className="flex justify-between">
              <span className="text-text-muted">Paket</span>
              <span className="font-semibold text-text-dark">{activeService?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Harga / {activeService?.unit || 'Kg'}</span>
              <span className="font-semibold text-text-dark">{formatPrice(pricePerKg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Estimasi Durasi</span>
              <span className="font-semibold text-text-dark">
                {estimatedDuration ? `${estimatedDuration} menit` : '-'}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="text-text-dark font-bold">Total Pembayaran</span>
              <span className="text-lg font-black text-emerald-brand">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Mendaftar Pesanan...
              </>
            ) : (
              <>
                <Plus size={14} />
                Place Order
              </>
            )}
          </button>

        </div>
      </div>
    </form>
  );
}
