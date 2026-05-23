import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, ClipboardList, Wallet } from 'lucide-react';
import { getCustomerDetail } from '@/actions/customers';
import { formatPrice, formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/ui/StatusBadge';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="inline-flex items-center justify-center rounded-xl border border-border-brand bg-white p-2.5 text-text-muted hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-navy-dark">{customer.name}</h2>
          <p className="text-xs text-text-muted">Profil dan Riwayat Laundry Pelanggan</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-light-bg text-navy-dark border border-border-brand">
            <User size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Kontak</span>
            <span className="text-sm font-extrabold text-navy-dark">{customer.phone}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-light-bg text-navy-dark border border-border-brand">
            <ClipboardList size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Frekuensi Cuci</span>
            <span className="text-sm font-extrabold text-navy-dark">{customer.totalOrders} Kali Transaksi</span>
          </div>
        </div>

        <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-light-bg text-navy-dark border border-border-brand">
            <Wallet size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Transaksi</span>
            <span className="text-lg font-black text-emerald-brand">{formatPrice(customer.totalSpend)}</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-navy-dark border-b border-border-brand pb-3">Riwayat Transaksi Laundry</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-brand bg-light-bg text-text-muted font-bold">
                <th className="p-3">KODE RESI</th>
                <th className="p-3">LAYANAN</th>
                <th className="p-3 text-center">BERAT</th>
                <th className="p-3">TOTAL HARGA</th>
                <th className="p-3 text-center">STATUS CUCIAN</th>
                <th className="p-3">TANGGAL MASUK</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    Pelanggan ini belum memiliki riwayat pencucian.
                  </td>
                </tr>
              ) : (
                customer.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-brand hover:bg-light-bg transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-navy-dark hover:text-emerald-brand hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold text-text-dark">{order.service.name}</td>
                    <td className="p-3 text-center font-bold text-text-dark">
                      {order.weightKg} {order.service.unit === 'ITEM' ? 'item' : 'kg'}
                    </td>
                    <td className="p-3 font-extrabold text-navy-dark">{formatPrice(order.totalPrice)}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3 text-text-muted">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
