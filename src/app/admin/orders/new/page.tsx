import React from 'react';
import Link from 'next/link';
import OrderForm from '@/components/orders/OrderForm';
import { getServices } from '@/actions/services';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const services = await getServices();
  const activeServices = services.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      {activeServices.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-amber-800">Belum Ada Layanan Aktif</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Anda harus mendaftarkan setidaknya satu layanan laundry aktif (misal: Regular atau Express) sebelum dapat membuat transaksi pesanan baru.
          </p>
          <Link
            href="/admin/services"
            className="inline-flex items-center justify-center rounded-xl bg-navy-dark px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            Atur Layanan Sekarang
          </Link>
        </div>
      ) : (
        <OrderForm services={activeServices} />
      )}
    </div>
  );
}
