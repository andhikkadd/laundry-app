'use client';

import React, { useState, useTransition } from 'react';
import { updateSettings } from '@/actions/settings';
import { Settings, Loader2, Save } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields State
  const [outletName, setOutletName] = useState(initialSettings.outlet_name || '');
  const [outletPhone, setOutletPhone] = useState(initialSettings.outlet_phone || '');
  const [outletAddress, setOutletAddress] = useState(initialSettings.outlet_address || '');
  const [openingHour, setOpeningHour] = useState(initialSettings.opening_hour || '08:00');
  const [closingHour, setClosingHour] = useState(initialSettings.closing_hour || '20:00');
  const [maxParallelOrders, setMaxParallelOrders] = useState(initialSettings.max_parallel_orders || '3');
  const [receiptFooter, setReceiptFooter] = useState(initialSettings.receipt_footer || '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      outlet_name: outletName,
      outlet_phone: outletPhone,
      outlet_address: outletAddress,
      opening_hour: openingHour,
      closing_hour: closingHour,
      max_parallel_orders: maxParallelOrders,
      receipt_footer: receiptFooter,
    };

    startTransition(async () => {
      const res = await updateSettings(payload);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess('Pengaturan outlet berhasil disimpan!');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
      {/* Inputs (Left) */}
      <div className="md:col-span-2 space-y-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {/* Identity Outlet Card */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2 flex items-center gap-2">
            <Settings size={16} className="text-emerald-brand" />
            Identitas Outlet
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="outlet_name" className="block text-xs font-semibold text-text-dark mb-1">
                Nama Outlet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="outlet_name"
                required
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="Bilasin Laundry"
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="outlet_phone" className="block text-xs font-semibold text-text-dark mb-1">
                No. Telepon Outlet <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="outlet_phone"
                required
                value={outletPhone}
                onChange={(e) => setOutletPhone(e.target.value)}
                placeholder="08123456789"
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="outlet_address" className="block text-xs font-semibold text-text-dark mb-1">
                Alamat Lengkap Outlet <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="outlet_address"
                required
                rows={3}
                value={outletAddress}
                onChange={(e) => setOutletAddress(e.target.value)}
                placeholder="Jalan Kebon Jeruk No. 12, Jakarta Barat"
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Operating Schedule / Limit Settings */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
            Jam Operasional & Kapasitas
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="opening_hour" className="block text-xs font-semibold text-text-dark mb-1">
                Jam Buka <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                id="opening_hour"
                required
                value={openingHour}
                onChange={(e) => setOpeningHour(e.target.value)}
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="closing_hour" className="block text-xs font-semibold text-text-dark mb-1">
                Jam Tutup <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                id="closing_hour"
                required
                value={closingHour}
                onChange={(e) => setClosingHour(e.target.value)}
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="max_parallel_orders" className="block text-xs font-semibold text-text-dark mb-1">
                Jumlah Mesin Cuci (Kapasitas) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="max_parallel_orders"
                required
                min="1"
                value={maxParallelOrders}
                onChange={(e) => setMaxParallelOrders(e.target.value)}
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden font-bold"
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
            Pengaturan Nota Belanja
          </h3>

          <div>
            <label htmlFor="receipt_footer" className="block text-xs font-semibold text-text-dark mb-1">
              Pesan Footer Struk <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="receipt_footer"
              required
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Terima kasih telah mempercayakan pakaian Anda kepada kami."
              className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden"
            />
          </div>
        </div>

      </div>

      {/* Save Button Sidebar (Right) */}
      <div>
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4 sticky top-6">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider">Simpan</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Menyimpan pengaturan di sini akan langsung merubah info struk cetak, jam operasional, dan kapasitas pembagian estimasi antrean order.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-brand py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={14} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
