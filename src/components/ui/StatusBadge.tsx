import React from 'react';
import { OrderStatus } from '@prisma/client';
import { Clock, Play, Gift, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let label = '';
  let config = {
    color: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-xs shadow-emerald-100/10',
    icon: <CheckCircle2 size={12} />,
  };

  switch (status) {
    case OrderStatus.QUEUED:
      label = 'Antre';
      config = {
        color: 'bg-indigo-50/85 text-indigo-700 border-indigo-150/70 shadow-xs shadow-indigo-100/10',
        icon: <Clock size={12} className="animate-spin-slow text-indigo-500" />,
      };
      break;
    case OrderStatus.PROCESSING:
      label = 'Diproses';
      config = {
        color: 'bg-amber-50/85 text-amber-700 border-amber-200/70 shadow-xs shadow-amber-100/10',
        icon: <Play size={11} className="animate-pulse text-amber-500" fill="currentColor" />,
      };
      break;
    case OrderStatus.READY:
      label = 'Siap Diambil';
      config = {
        color: 'bg-emerald-50/85 text-emerald-700 border-emerald-250/70 shadow-xs shadow-emerald-100/10',
        icon: <Gift size={12} className="text-emerald-600" />,
      };
      break;
    case OrderStatus.PICKED_UP:
      label = 'Selesai';
      config = {
        color: 'bg-slate-100/80 text-slate-700 border-slate-200/80',
        icon: <CheckCircle2 size={12} className="text-slate-500" />,
      };
      break;
    case OrderStatus.CANCELLED:
      label = 'Batal';
      config = {
        color: 'bg-rose-50/80 text-rose-700 border-rose-200/80',
        icon: <AlertTriangle size={12} className="text-rose-500" />,
      };
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all duration-300 ${config.color} ${className}`}>
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
