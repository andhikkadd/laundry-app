import React from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getOrders } from '@/actions/orders';
import { getServices } from '@/actions/services';
import { formatPrice, formatDateTime } from '@/lib/format';
import { OrderStatus } from '@prisma/client';

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: OrderStatus;
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
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/queue"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-150 bg-indigo-50/80 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Pantau Antrean Kerja
          </Link>
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 shadow-2xs cursor-pointer"
          >
            <Plus size={18} />
            Buat Pesanan
          </Link>
        </div>
      </div>

      {/* Filters Form */}
      <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs">
        <form method="GET" action="/admin/orders" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          
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
                <th className="p-4">ESTIMASI SELESAI</th>
                <th className="p-4">TANGGAL MASUK</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-text-muted">
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
                    <td className="p-4 text-center font-bold text-text-dark">
                      {order.weightKg} {order.service.unit === 'ITEM' ? 'item' : 'kg'}
                    </td>
                    <td className="p-4 font-extrabold text-navy-dark">{formatPrice(order.totalPrice)}</td>
                    <td className="p-4 text-center">
                      <StatusBadge status={order.status} />
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
