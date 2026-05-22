import React from 'react';
import { getReportsData } from '@/actions/reports';
import { formatPrice, formatDateTime } from '@/lib/format';
import { BarChart3, Banknote, ClipboardCheck, Award, Package, Weight, TrendingUp, Download } from 'lucide-react';
import DashboardCard from '@/components/admin/DashboardCard';
import ReportsCharts from '@/components/admin/ReportsCharts';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const reports = await getReportsData();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-text-muted mt-0.5">
            Ringkasan performa outlet bulan berjalan — pendapatan, volume cucian, dan catatan transaksi.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardCard
          title="Omzet Hari Ini"
          value={formatPrice(reports.revenueToday)}
          icon={<Banknote size={18} />}
          description="Lunas hari ini"
        />
        <DashboardCard
          title="Omzet Minggu Ini"
          value={formatPrice(reports.revenueThisWeek)}
          icon={<TrendingUp size={18} />}
          description="Sen — Min minggu ini"
        />
        <DashboardCard
          title="Omzet Bulan Ini"
          value={formatPrice(reports.revenueThisMonth)}
          icon={<BarChart3 size={18} />}
          description="Total pendapatan bulan berjalan"
        />
        <DashboardCard
          title="Total Pesanan"
          value={`${reports.totalOrdersThisMonth}`}
          icon={<Package size={18} />}
          description="Pesanan masuk bulan ini"
        />
        <DashboardCard
          title="Cucian Diambil"
          value={`${reports.completedOrdersThisMonth}`}
          icon={<ClipboardCheck size={18} />}
          description="Selesai & picked up"
        />
        <DashboardCard
          title="Total Berat"
          value={`${reports.totalWeightKgThisMonth} kg`}
          icon={<Weight size={18} />}
          description="Volume cucian bulan ini"
        />
      </div>

      {/* Charts Section (Client Component) */}
      <ReportsCharts
        dailyRevenue={reports.dailyRevenue}
        serviceDistribution={reports.serviceDistribution}
        statusDistribution={reports.statusDistribution}
        mostUsedService={reports.mostUsedService}
      />

      {/* Transaction Log Table */}
      <div className="rounded-xl border border-border-brand bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-brand bg-light-bg/50">
          <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
            Log Transaksi Pelunasan Terkini
          </h3>
          <span className="text-[10px] font-bold text-text-muted bg-white border border-border-brand rounded-full px-3 py-1">
            15 transaksi terakhir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-brand bg-light-bg/30 text-text-muted font-bold text-[10px] uppercase tracking-wider">
                <th className="p-3.5">Kode Resi</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Jumlah Bayar</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5">Tanggal Lunas</th>
              </tr>
            </thead>
            <tbody>
              {reports.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">📋</span>
                      <span className="text-xs font-medium">Belum ada transaksi pembayaran lunas tercatat.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border-brand/50 hover:bg-light-bg/60 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-navy-dark font-mono text-[11px]">
                      {tx.order?.orderCode || 'N/A'}
                    </td>
                    <td className="p-3.5 font-semibold text-text-dark">
                      {tx.order?.customer?.name || 'N/A'}
                    </td>
                    <td className="p-3.5 text-text-muted font-medium">
                      {tx.order?.service?.name || '-'}
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-brand">
                      {formatPrice(tx.amount)}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200 uppercase">
                        {tx.method === 'CASH' ? 'Tunai' : tx.method}
                      </span>
                    </td>
                    <td className="p-3.5 text-text-muted text-[11px]">
                      {tx.paidAt ? formatDateTime(tx.paidAt) : '-'}
                    </td>
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
