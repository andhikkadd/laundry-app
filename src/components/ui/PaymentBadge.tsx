import React from 'react';
import { PaymentStatus } from '@prisma/client';

interface PaymentBadgeProps {
  status: PaymentStatus;
}

export default function PaymentBadge({ status }: PaymentBadgeProps) {
  let label = '';
  let colorClass = '';

  switch (status) {
    case PaymentStatus.UNPAID:
      label = 'Belum Bayar';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case PaymentStatus.PAID:
      label = 'Lunas';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case PaymentStatus.REFUNDED:
      label = 'Refund';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}
