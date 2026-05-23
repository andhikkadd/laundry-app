'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { Award, Download, Printer } from 'lucide-react';

interface DailyRevenue {
  date: string;
  label: string;
  revenue: number;
}

interface ServiceDist {
  name: string;
  count: number;
}

interface StatusDist {
  status: string;
  count: number;
}

interface ReportsChartsProps {
  dailyRevenue: DailyRevenue[];
  serviceDistribution: ServiceDist[];
  statusDistribution: StatusDist[];
  mostUsedService: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  QUEUED: { bg: 'bg-amber-400', text: 'text-amber-700', label: 'Antrean' },
  PROCESSING: { bg: 'bg-emerald-400', text: 'text-emerald-700', label: 'Proses' },
  READY: { bg: 'bg-teal-400', text: 'text-teal-700', label: 'Siap Ambil' },
  PICKED_UP: { bg: 'bg-slate-400', text: 'text-slate-700', label: 'Selesai' },
  CANCELLED: { bg: 'bg-rose-400', text: 'text-rose-700', label: 'Batal' },
};

const SERVICE_COLORS = ['#10B981', '#059669', '#0D9488', '#14B8A6', '#06B6D4', '#0EA5E9'];

export default function ReportsCharts({
  dailyRevenue,
  serviceDistribution,
  statusDistribution,
  mostUsedService,
}: ReportsChartsProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const totalOrders = statusDistribution.reduce((sum, s) => sum + s.count, 0);
  const totalServiceOrders = serviceDistribution.reduce((sum, s) => sum + s.count, 0);

  // CSV export handler
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Pendapatan (Rp)'];
    const rows = dailyRevenue.map((d) => [d.date, d.revenue.toString()]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pendapatan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Reports Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 bg-slate-50 p-3 rounded-xl border border-border-brand/60 no-print">
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Download size={14} />
          Unduh Laporan CSV
        </button>
        <button
          onClick={() => {
            document.body.classList.add('print-report-mode');
            window.print();
            setTimeout(() => {
              document.body.classList.remove('print-report-mode');
            }, 1000);
          }}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-navy-dark hover:bg-slate-800 rounded-lg px-4 py-2 transition-colors shadow-2xs cursor-pointer"
        >
          <Printer size={14} />
          Cetak Dokumen Laporan
        </button>
      </div>

      {/* Row 1: Revenue Bar Chart + Service Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* 14-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border-brand bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
              Tren Pendapatan 14 Hari Terakhir
            </h3>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-brand hover:text-emerald-700 transition-colors border border-emerald-200 rounded-lg px-2.5 py-1.5 hover:bg-emerald-50"
            >
              <Download size={12} />
              Unduh CSV
            </button>
          </div>

          {dailyRevenue.every((d) => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-3xl mb-3">📊</span>
              <p className="text-xs font-bold text-slate-400">Belum ada pendapatan tercatat dalam 14 hari terakhir</p>
              <p className="text-[10px] text-slate-350 mt-1">Grafik akan muncul otomatis setelah ada transaksi lunas.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Y-axis labels */}
              <div className="flex items-end gap-1.5" style={{ height: '200px' }}>
                {dailyRevenue.map((day, i) => {
                  const barHeight = day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 170, 4) : 2;
                  const isHovered = hoveredBar === i;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center justify-end relative group"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && day.revenue > 0 && (
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap">
                          <div className="text-[9px] text-slate-400">{day.label}</div>
                          <div className="text-emerald-brand text-xs font-black mt-0.5">{formatPrice(day.revenue)}</div>
                        </div>
                      )}
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-200 cursor-pointer ${
                          day.revenue > 0
                            ? isHovered
                              ? 'bg-emerald-500'
                              : 'bg-emerald-brand/70'
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${barHeight}px`, minWidth: '8px' }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X axis labels */}
              <div className="flex gap-1.5 mt-2">
                {dailyRevenue.map((day, i) => (
                  <div key={day.date} className="flex-1 text-center">
                    <span className={`text-[8px] font-bold ${i % 2 === 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                      {day.label.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service Distribution + Most Popular */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-6">
          {/* Most popular */}
          <div className="text-center pb-4 border-b border-border-brand">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-brand uppercase tracking-wider mb-2">
              <Award size={14} />
              Layanan Terlaris
            </div>
            <p className="text-sm font-black text-navy-dark">{mostUsedService}</p>
          </div>

          {/* Distribution bars */}
          <div>
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
              Distribusi Layanan Bulan Ini
            </h4>
            {serviceDistribution.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {serviceDistribution.map((svc, i) => {
                  const pct = totalServiceOrders > 0 ? (svc.count / totalServiceOrders) * 100 : 0;
                  return (
                    <div key={svc.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-text-dark">{svc.name}</span>
                        <span className="text-[10px] font-extrabold text-navy-dark">{svc.count} <span className="text-text-muted font-medium">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Order Status Distribution */}
      <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs">
        <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider mb-5">
          Distribusi Status Pesanan Bulan Ini
        </h3>
        {statusDistribution.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada pesanan bulan ini.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Visual bar segments */}
            <div className="flex-1">
              <div className="flex h-8 rounded-lg overflow-hidden border border-border-brand">
                {statusDistribution.map((st) => {
                  const pct = totalOrders > 0 ? (st.count / totalOrders) * 100 : 0;
                  const meta = STATUS_COLORS[st.status] || { bg: 'bg-slate-300', text: 'text-slate-600', label: st.status };
                  return (
                    <div
                      key={st.status}
                      className={`${meta.bg} transition-all duration-300 flex items-center justify-center`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                      title={`${meta.label}: ${st.count} (${pct.toFixed(1)}%)`}
                    >
                      {pct > 12 && (
                        <span className="text-[9px] font-black text-white drop-shadow-sm">{pct.toFixed(0)}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {statusDistribution.map((st) => {
                  const meta = STATUS_COLORS[st.status] || { bg: 'bg-slate-300', text: 'text-slate-600', label: st.status };
                  return (
                    <div key={st.status} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${meta.bg}`} />
                      <span className={`text-[10px] font-bold ${meta.text}`}>
                        {meta.label} ({st.count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total card */}
            <div className="flex flex-col items-center justify-center bg-light-bg rounded-xl border border-border-brand px-6 py-4 min-w-[120px]">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-navy-dark mt-1">{totalOrders}</span>
              <span className="text-[10px] text-text-muted font-medium">pesanan</span>
            </div>
          </div>
        )}
      </div>

      {/* PRINT REPORT AREA ONLY VISIBLE IN WINDOW.PRINT() */}
      <div id="print-report-area" className="hidden">
        <div style={{ padding: '20px', color: 'black' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>BILASIN LAUNDRY</h2>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Laporan Kinerja Bulanan & Analisis Omzet</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>Tanggal Cetak:</p>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Key Indicators Table */}
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Ringkasan Indikator Kunci</h3>
          <table style={{ width: '100%', marginBottom: '25px', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '10px' }}>Indikator</th>
                <th style={{ padding: '10px' }}>Nilai/Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Total Pendapatan Terkumpul (14 Hari)</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#059669' }}>
                  {formatPrice(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0))}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Layanan Terpopuler</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{mostUsedService}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Total Volume Transaksi</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalOrders} pesanan</td>
              </tr>
            </tbody>
          </table>

          {/* Service Distribution Table */}
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Distribusi Layanan</h3>
          <table style={{ width: '100%', marginBottom: '25px', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '10px' }}>Nama Layanan</th>
                <th style={{ padding: '10px' }}>Jumlah Pesanan</th>
                <th style={{ padding: '10px' }}>Presentase</th>
              </tr>
            </thead>
            <tbody>
              {serviceDistribution.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '10px', textAlign: 'center', color: '#666' }}>Belum ada data distribusi layanan</td>
                </tr>
              ) : (
                serviceDistribution.map((svc) => {
                  const pct = totalServiceOrders > 0 ? (svc.count / totalServiceOrders) * 100 : 0;
                  return (
                    <tr key={svc.name}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{svc.name}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{svc.count}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Daily Revenue Log */}
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Detail Log Pendapatan Harian</h3>
          <table style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '10px' }}>Tanggal</th>
                <th style={{ padding: '10px' }}>Pendapatan Lunas</th>
              </tr>
            </thead>
            <tbody>
              {dailyRevenue.map((d) => (
                <tr key={d.date}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>{d.label}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: d.revenue > 0 ? '#059669' : '#000' }}>
                    {formatPrice(d.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
