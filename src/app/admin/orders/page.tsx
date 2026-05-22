import React from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PaymentBadge from '@/components/ui/PaymentBadge';
import { getOrders } from '@/actions/orders';
import { getServices } from '@/actions/services';
import { formatPrice, formatDateTime } from '@/lib/format';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    serviceId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const filters = await searchParams;
  
  // Resolve filters
  const resolvedFilters = {
    search: filters.search || undefined,
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    serviceId: filters.serviceId || undefined,
  };

  // Fetch data
  const [orders, services] = await Promise.all([
    getOrders(resolvedFilters),
    getServices(),
  ]);

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-muted">
            Total ditemukan: <span className="font-semibold text-text-dark">{orders.length} pesanan</span>
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 self-start sm:self-auto"
        >
          <Plus size={18} />
          Buat Pesanan
        </Link>
      </div>

      {/* Filters Form */}
      <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs">
        <form method="GET" action="/admin/orders" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          
          {/* Search bar */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-bold text-navy-dark uppercase tracking-wider mb-2">
              Cari Pesanan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={filters.search || ''}
                placeholder="Kode resi, nama, atau no. telepon..."
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 pl-9 pr-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-xs font-bold text-navy-dark uppercase tracking-wider mb-2">
              Status Cucian
            </label>
            <select
              name="status"
              id="status"
              defaultValue={filters.status || ''}
              className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="">Semua Status</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label htmlFor="paymentStatus" className="block text-xs font-bold text-navy-dark uppercase tracking-wider mb-2">
              Status Bayar
            </label>
            <select
              name="paymentStatus"
              id="paymentStatus"
              defaultValue={filters.paymentStatus || ''}
              className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="">Semua Pembayaran</option>
              {Object.values(PaymentStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy-dark py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Filter size={14} />
              Filter
            </button>
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-xl border border-border-brand bg-white p-2.5 text-text-muted hover:bg-slate-50 transition-colors"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
            </Link>
          </div>

        </form>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border-brand bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-brand bg-light-bg text-text-muted font-bold">
                <th className="p-4">KODE RESI</th>
                <th className="p-4">PELANGGAN</th>
                <th className="p-4">LAYANAN</th>
                <th className="p-4 text-center">BERAT</th>
                <th className="p-4">TOTAL</th>
                <th className="p-4 text-center">STATUS</th>
                <th className="p-4 text-center">PEMBAYARAN</th>
                <th className="p-4">ESTIMASI SELESAI</th>
                <th className="p-4">TANGGAL MASUK</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-text-muted">
                    Tidak ada pesanan laundry yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-brand hover:bg-light-bg transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-navy-dark hover:text-emerald-brand hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-text-dark">{order.customer.name}</div>
                      <div className="text-[10px] text-text-muted">{order.customer.phone || '-'}</div>
                    </td>
                    <td className="p-4 font-semibold text-text-dark">{order.service.name}</td>
                    <td className="p-4 text-center font-bold text-text-dark">{order.weightKg} kg</td>
                    <td className="p-4 font-extrabold text-navy-dark">{formatPrice(order.totalPrice)}</td>
                    <td className="p-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-center">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="p-4 font-semibold text-text-muted">
                      {formatDateTime(order.estimatedEndAt)}
                    </td>
                    <td className="p-4 text-text-muted">{formatDateTime(order.createdAt)}</td>
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
