'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/format';

interface ChartDataPoint {
  label: string;
  dateStr: string;
  revenue: number;
}

interface RevenueAreaChartProps {
  data: ChartDataPoint[];
  maxRevenue: number;
}

export default function RevenueAreaChart({ data, maxRevenue }: RevenueAreaChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // SVG Coordinates mapping
  const height = 180;
  const width = 600;
  const paddingX = 40;
  const paddingY = 30;

  const hasData = data.some((d) => d.revenue > 0);
  const firstActiveIdx = data.findIndex((d) => d.revenue > 0);

  const points = data.map((day, i) => {
    const x = paddingX + i * ((width - paddingX * 2) / (data.length - 1));
    const y = height - paddingY - (day.revenue / (maxRevenue || 1)) * (height - paddingY * 2);
    return { x, y, ...day };
  });

  // Only draw lines/area for active points starting from the first non-zero revenue day
  const activePoints = firstActiveIdx !== -1 ? points.slice(firstActiveIdx) : [];

  // Generate smooth cubic bezier line path for active points
  const linePath = activePoints.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    // Control points for smooth curve
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  // Close the area loop for the gradient background
  const areaPath = activePoints.length > 0 
    ? `${linePath} L ${activePoints[activePoints.length - 1].x} ${height - paddingY} L ${activePoints[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="relative flex-1 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 select-none min-h-[220px]">
      {/* Empty State Overlay */}
      {!hasData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-slate-50/20 backdrop-blur-[1px]">
          <span className="text-2xl leading-none">📊</span>
          <span className="text-xs font-bold text-slate-400 mt-2">Belum ada transaksi pendapatan tercatat</span>
          <span className="text-[10px] text-slate-350 mt-0.5">Grafik akan terupdate otomatis setelah kasir mencatat pelunasan.</span>
        </div>
      )}

      {/* Dynamic Floating Tooltip */}
      {hasData && activeIdx !== null && points[activeIdx].revenue > 0 && (
        <div 
          className="absolute z-10 bg-slate-900 text-white text-[10px] font-bold py-2 px-3 rounded-lg shadow-lg transition-all duration-150 pointer-events-none border border-slate-700/50"
          style={{ 
            left: `${(points[activeIdx].x / width) * 100}%`,
            top: `${(points[activeIdx].y / height) * 100 - 24}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-[9px] text-slate-400 font-medium leading-none">{points[activeIdx].dateStr}</div>
          <div className="mt-1 text-emerald-brand text-xs font-black">{formatPrice(points[activeIdx].revenue)}</div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className={`w-full h-full min-h-[180px] overflow-visible ${!hasData ? 'opacity-30' : ''}`}
      >
        <defs>
          {/* Gradient fills */}
          <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="chart-line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line 
          x1={paddingX} y1={height - paddingY} 
          x2={width - paddingX} y2={height - paddingY} 
          stroke="#e2e8f0" strokeWidth="1" 
        />
        <line 
          x1={paddingX} y1={height / 2} 
          x2={width - paddingX} y2={height / 2} 
          stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4"
        />
        <line 
          x1={paddingX} y1={paddingY} 
          x2={width - paddingX} y2={paddingY} 
          stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4"
        />

        {/* Shaded Area */}
        {hasData && areaPath && (
          <path 
            d={areaPath} 
            fill="url(#chart-area-gradient)" 
            className="transition-all duration-300"
          />
        )}

        {/* Stroke Line */}
        {hasData && linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="url(#chart-line-gradient)" 
            strokeWidth="3.2" 
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        )}

        {/* Chart Interaction Circles */}
        {hasData && points.map((p, i) => {
          const isHovered = activeIdx === i;
          const hasRevenue = p.revenue > 0;
          if (!hasRevenue) return null; // Don't draw circles for empty revenue days

          return (
            <g key={p.dateStr}>
              {/* Vertical line indicator on hover */}
              {isHovered && (
                <line 
                  x1={p.x} y1={paddingY} 
                  x2={p.x} y2={height - paddingY} 
                  stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
              )}

              {/* Large invisible catch circle for better mobile/mouse hover */}
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              />

              {/* Visual Node */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 7.5 : 5.5}
                fill={isHovered ? '#10B981' : '#ffffff'}
                stroke="#10B981"
                strokeWidth={isHovered ? 2.5 : 3}
                className="transition-all duration-200 ease-out pointer-events-none drop-shadow-sm"
              />
            </g>
          );
        })}
      </svg>

      {/* X Axis Labels */}
      <div className="flex justify-between px-[34px] mt-2">
        {data.map((day) => (
          <div key={day.dateStr} className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold text-slate-700">{day.label}</span>
            <span className="text-[9px] text-slate-400 font-semibold">{day.dateStr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
