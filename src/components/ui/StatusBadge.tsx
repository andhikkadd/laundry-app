import React from 'react';
import { OrderStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let label = '';
  let colorClass = '';

  switch (status) {
    case OrderStatus.QUEUED:
      label = 'Antre';
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case OrderStatus.PROCESSING:
      label = 'Diproses';
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case OrderStatus.READY:
      label = 'Siap Diambil';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case OrderStatus.PICKED_UP:
      label = 'Sudah Diambil';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case OrderStatus.CANCELLED:
      label = 'Batal';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}
