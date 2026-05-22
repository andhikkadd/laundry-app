import React from 'react';
import Link from 'next/link';
import { Search, Users, RotateCcw } from 'lucide-react';
import { getCustomers } from '@/actions/customers';
import { formatPrice, formatDateTime } from '@/lib/format';

interface CustomersPageProps {
  searchParams: Promise<{ search?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const searchQuery = params.search || '';

  const customers = await getCustomers(searchQuery);

  return (
    <div className="space-y-6">
      
      {/* Search Header Form */}
      <div className="rounded-xl border border-border-brand bg-white p-5 shadow-xs">
        <form method="GET" action="/admin/customers" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-xs font-bold text-navy-dark uppercase tracking-wider mb-2">
              Cari Pelanggan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchQuery}
                placeholder="Cari nama atau nomor telepon..."
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 pl-9 pr-3 text-xs text-text-dark placeholder-text-muted focus:border-emerald-brand focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 rounded-xl bg-navy-dark py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              Cari
            </button>
            <Link
              href="/admin/customers"
              className="inline-flex items-center justify-center rounded-xl border border-border-brand bg-white p-2.5 text-text-muted hover:bg-slate-50 transition-colors"
              title="Reset Pencarian"
            >
              <RotateCcw size={14} />
            </Link>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-border-brand bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-brand bg-light-bg text-text-muted font-bold">
                <th className="p-4">NAMA PELANGGAN</th>
                <th className="p-4">NO. TELEPON</th>
                <th className="p-4 text-center">TOTAL TRANSAKSI</th>
                <th className="p-4">TOTAL SPENDING</th>
                <th className="p-4">ORDER TERAKHIR</th>
                <th className="p-4">TERDAFTAR PADA</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-muted">
                    Tidak ada pelanggan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border-brand hover:bg-light-bg transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-bold text-navy-dark hover:text-emerald-brand hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-4 font-semibold text-text-dark">{c.phone}</td>
                    <td className="p-4 text-center font-bold text-text-dark">{c.totalOrders} order</td>
                    <td className="p-4 font-extrabold text-emerald-brand">{formatPrice(c.totalSpend)}</td>
                    <td className="p-4 text-text-muted">
                      {c.lastOrderDate ? formatDateTime(c.lastOrderDate) : 'Belum pernah'}
                    </td>
                    <td className="p-4 text-text-muted">{formatDateTime(c.createdAt)}</td>
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
