import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendColor?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  description,
  trend,
  trendColor = 'text-emerald-brand',
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-border-brand bg-white p-4.5 shadow-xs transition-all hover:shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted">{title}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-light-bg text-navy-dark border border-border-brand">
          {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 16 }) : icon}
        </div>
      </div>
      <div className="mt-2.5">
        <span className="text-2xl font-black text-navy-dark tracking-tight">
          {value}
        </span>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
            {trend && <span className={`font-bold ${trendColor}`}>{trend}</span>}
            {description && <span>{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
