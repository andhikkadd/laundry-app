import React from 'react';
import { getReportsData } from '@/actions/reports';
import { formatPrice, formatDateTime } from '@/lib/format';
import { BarChart3, Banknote, ClipboardCheck, Award, Package, Weight, TrendingUp, Download } from 'lucide-react';
import DashboardCard from '@/components/admin/DashboardCard';
import ReportsCharts from '@/components/admin/ReportsCharts';

export const dynamic = 'force-dynamic';

interface AdminReportsPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const params = await searchParams;
  const { startDate, endDate } = params;

  const reports = await getReportsData({
    startDate,
    endDate,
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Page Header with Date Filter */}
      <div className="bg-white border border-border-brand rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 no-print">
        <div>
          <h2 className="text-lg font-black text-navy-dark">Laporan Keuangan & Performa</h2>
          <p className="text-[11px] text-text-muted mt-0.5 font-semibold">
            Ringkasan performa outlet - pendapatan, volume cucian, dan catatan transaksi.
          </p>
        </div>

        <form method="GET" className="flex flex-wrap items-end gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div>
              <label htmlFor="startDate" className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Dari Tanggal</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                defaultValue={startDate || ''}
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark font-bold focus:border-emerald-brand focus:bg-white focus:outline-hidden"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Sampai Tanggal</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={endDate || ''}
                className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark font-bold focus:border-emerald-brand focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-emerald-brand text-xs font-bold text-white px-4 py-2 hover:bg-emerald-600 shadow-2xs transition-colors cursor-pointer"
            >
              Terapkan
            </button>
            {(startDate || endDate) && (
              <a
                href="/admin/reports"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset
              </a>
            )}
          </div>
        </form>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Omzet Hari Ini"
          value={formatPrice(reports.revenueToday)}
          icon={<Banknote size={18} />}
          description="Hari ini"
        />
        <DashboardCard
          title="Omzet Minggu Ini"
          value={formatPrice(reports.revenueThisWeek)}
          icon={<TrendingUp size={18} />}
          description="Sen - Min minggu ini"
        />
        <DashboardCard
          title={startDate || endDate ? "Omzet Terfilter" : "Omzet Bulan Ini"}
          value={formatPrice(reports.revenueThisMonth)}
          icon={<BarChart3 size={18} />}
          description={startDate || endDate ? "Total omzet rentang waktu terfilter" : "Total omzet bulan berjalan"}
        />
        <DashboardCard
          title="Total Pesanan"
          value={`${reports.totalOrdersThisMonth}`}
          icon={<Package size={18} />}
          description={startDate || endDate ? "Pesanan masuk rentang terfilter" : "Pesanan masuk bulan ini"}
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
