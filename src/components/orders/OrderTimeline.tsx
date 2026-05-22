import React from 'react';
import { OrderStatus } from '@prisma/client';
import { Check, Loader, Gift, Home, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

interface StatusLog {
  status: OrderStatus;
  createdAt: Date;
  note?: string | null;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  logs: StatusLog[];
}

export default function OrderTimeline({ currentStatus, logs }: OrderTimelineProps) {
  // If cancelled, show a specialized timeline or notice
  const isCancelled = currentStatus === OrderStatus.CANCELLED;

  const steps = [
    {
      key: OrderStatus.QUEUED,
      label: 'Diterima / Antre',
      desc: 'Pesanan masuk dalam antrean pencucian',
      icon: Loader,
    },
    {
      key: OrderStatus.PROCESSING,
      label: 'Diproses',
      desc: 'Pakaian sedang dicuci, dikeringkan, atau disetrika',
      icon: Loader,
    },
    {
      key: OrderStatus.READY,
      label: 'Siap Diambil',
      desc: 'Laundry selesai dan siap diambil di outlet',
      icon: Gift,
    },
    {
      key: OrderStatus.PICKED_UP,
      label: 'Sudah Diambil',
      desc: 'Pakaian telah diambil oleh customer',
      icon: Home,
    },
  ];

  // Helper to find log for a specific status
  const getLogForStatus = (status: OrderStatus) => {
    return logs.find((l) => l.status === status);
  };

  // Helper to determine status order index
  const getStatusIndex = (status: OrderStatus) => {
    const indices: Record<OrderStatus, number> = {
      [OrderStatus.QUEUED]: 0,
      [OrderStatus.PROCESSING]: 1,
      [OrderStatus.READY]: 2,
      [OrderStatus.PICKED_UP]: 3,
      [OrderStatus.CANCELLED]: -1,
    };
    return indices[status];
  };

  const currentIndex = getStatusIndex(currentStatus);

  if (isCancelled) {
    const cancelLog = getLogForStatus(OrderStatus.CANCELLED);
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-800">Pesanan Dibatalkan</h4>
            <p className="mt-1 text-sm text-rose-700">
              Pencucian pakaian telah dibatalkan oleh petugas.
            </p>
            {cancelLog && (
              <div className="mt-3 text-xs text-rose-600">
                <span className="font-semibold">Waktu Batal:</span> {formatDateTime(cancelLog.createdAt)}
                {cancelLog.note && (
                  <p className="mt-1 font-medium bg-rose-100/50 p-2 rounded-lg italic">
                    &quot;{cancelLog.note}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {steps.map((step, stepIdx) => {
          const log = getLogForStatus(step.key);
          const stepIndex = getStatusIndex(step.key);
          
          const isDone = stepIndex < currentIndex || currentStatus === OrderStatus.PICKED_UP;
          const isCurrent = stepIndex === currentIndex && currentStatus !== OrderStatus.PICKED_UP;
          const isUpcoming = stepIndex > currentIndex;

          const StepIcon = step.icon;

          return (
            <li key={step.key}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      isDone ? 'bg-emerald-brand' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white transition-all ${
                        isDone
                          ? 'bg-emerald-brand text-white'
                          : isCurrent
                          ? 'bg-amber-brand text-white animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <StepIcon size={14} className={isCurrent ? 'animate-spin' : ''} />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                    <div>
                      <p className={`text-sm font-bold ${isUpcoming ? 'text-text-muted font-semibold' : 'text-navy-dark'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                      {log?.note && (
                        <span className="mt-1 inline-block text-[11px] text-text-muted italic bg-light-bg px-2 py-0.5 rounded border border-border-brand">
                          Catatan: {log.note}
                        </span>
                      )}
                    </div>
                    {log && (
                      <div className="text-right text-xs text-text-muted whitespace-nowrap">
                        <time dateTime={log.createdAt.toISOString()}>
                          {formatDateTime(log.createdAt).split(', ')[1]}
                          <span className="block text-[10px]">{formatDateTime(log.createdAt).split(', ')[0]}</span>
                        </time>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
