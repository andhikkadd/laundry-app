import React from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Hourglass,
  Sparkles,
  Banknote,
  Activity,
  Plus,
  ArrowRight,
} from 'lucide-react';
import DashboardCard from '@/components/admin/DashboardCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getDashboardStats } from '@/actions/orders';
import { formatPrice, formatDateTime } from '@/lib/format';
import { OrderStatus } from '@prisma/client';
import RevenueAreaChart from '@/components/admin/RevenueAreaChart';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  // Active queue filter (status: QUEUED or PROCESSING, excluding unpaid cashless orders)
  const activeQueue = stats.recentOrders.filter((o) => {
    const isCashlessUnpaid =
      (o.paymentMethod === 'QRIS' ||
        o.paymentMethod === 'TRANSFER' ||
        o.paymentMethod === 'EWALLET') &&
      o.paymentStatus === 'UNPAID';
    return (
      (o.status === OrderStatus.QUEUED || o.status === OrderStatus.PROCESSING) &&
      !isCashlessUnpaid
    );
  });

  // Calculate maximum revenue for chart scaling
  const maxRevenue = Math.max(...stats.revenueChartData.map((d) => d.revenue), 10000);
  const totalWeeklyRevenue = stats.revenueChartData.reduce((acc, curr) => acc + curr.revenue, 0);
  const averageWeeklyRevenue = Math.round(totalWeeklyRevenue / 7);

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-navy-dark">Selamat Datang di Bilasin!</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Ringkasan performa harian dan visual antrean pengerjaan outlet laundry Anda.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-md self-start sm:self-auto"
        >
          <Plus size={18} />
          Buat Pesanan Baru
        </Link>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Pesanan Hari Ini"
          value={stats.todayOrdersCount}
          icon={<ClipboardList size={20} />}
          description="Total nota masuk hari ini"
        />
        <DashboardCard
          title="Beban Kerja Aktif"
          value={stats.activeWorkload}
          icon={<Activity size={20} />}
          description={`${stats.queuedCount} antre, ${stats.processingCount} diproses`}
          trend={stats.activeWorkload > 5 ? 'Tinggi' : 'Normal'}
          trendColor={stats.activeWorkload > 5 ? 'text-amber-brand' : 'text-emerald-brand'}
        />
        <DashboardCard
          title="Siap Diambil"
          value={stats.readyCount}
          icon={<Sparkles size={20} />}
          description="Cucian selesai menunggu pickup"
          trendColor="text-emerald-brand"
        />
        <DashboardCard
          title="Pendapatan Hari Ini"
          value={formatPrice(stats.todayRevenue)}
          icon={<Banknote size={20} />}
          description="Omzet pembayaran lunas hari ini"
        />
      </div>

      {/* visual chart section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-navy-dark flex items-center gap-2">
            <Activity size={18} className="text-emerald-brand" />
            Grafik Tren Pendapatan (7 Hari Terakhir)
          </h3>
          <p className="text-xs text-text-muted">Visualisasi nominal transaksi pembayaran lunas harian.</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
          <RevenueAreaChart data={stats.revenueChartData} maxRevenue={maxRevenue} />


          <div className="w-full lg:w-72 bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between h-56">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rata-rata Pendapatan</span>
              <h4 className="text-2xl font-black text-navy-dark">{formatPrice(averageWeeklyRevenue)}</h4>
              <p className="text-[11px] text-text-muted mt-1 leading-normal">
                Berdasarkan total transaksi lunas yang tercatat selama satu minggu terakhir.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-text-muted font-medium">Total Omzet Mingguan:</span>
              <span className="font-extrabold text-emerald-brand">{formatPrice(totalWeeklyRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Active Queue list */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-navy-dark flex items-center gap-2">
              <Hourglass size={18} className="text-amber-brand" />
              Antrean Berjalan
            </h3>
            <Link
              href="/admin/queue"
              className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
            >
              Kelola Antrean
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activeQueue.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">
                Tidak ada cucian di antrean aktif saat ini.
              </p>
            ) : (
              activeQueue.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center hover:border-emerald-200 hover:bg-white transition-all duration-255"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-bold text-navy-dark hover:text-emerald-brand transition-colors"
                    >
                      {order.orderCode}
                    </Link>
                    <p className="text-xs text-text-muted">
                      {order.customer.name} • <span className="font-semibold text-text-dark">{order.weightKg} {order.service.unit === 'ITEM' ? 'item' : 'kg'}</span>
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Selesai: {formatDateTime(order.estimatedEndAt).split(', ')[1]}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Recent Orders Table */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-navy-dark flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-brand" />
              Aktivitas Pesanan Terkini
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted font-bold border-b border-slate-100">
                  <th className="p-3.5">KODE RESI</th>
                  <th className="p-3.5">PELANGGAN</th>
                  <th className="p-3.5">LAYANAN</th>
                  <th className="p-3.5 text-center">BERAT</th>
                  <th className="p-3.5">TOTAL</th>
                  <th className="p-3.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-text-muted">
                      Belum ada transaksi pesanan laundry.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-navy-dark hover:text-emerald-brand hover:underline transition-colors"
                        >
                          {order.orderCode}
                        </Link>
                      </td>
                      <td className="p-3.5 font-semibold text-text-dark">{order.customer.name}</td>
                      <td className="p-3.5 font-semibold text-text-dark">{order.service.name}</td>
                      <td className="p-3.5 text-center font-bold text-text-dark">
                        {order.weightKg} {order.service.unit === 'ITEM' ? 'item' : 'kg'}
                      </td>
                      <td className="p-3.5 font-extrabold text-navy-dark">{formatPrice(order.totalPrice)}</td>
                      <td className="p-3.5 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
