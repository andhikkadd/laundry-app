'use client';

import React, { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/actions/orders';
import { OrderStatus } from '@prisma/client';
import { formatPrice, formatDateTime } from '@/lib/format';
import { Play, CheckCircle, ClipboardCheck, Timer, User, ShoppingBag, Check } from 'lucide-react';

interface Order {
  id: string;
  orderCode: string;
  weightKg: number;
  totalPrice: number;
  queueNumber: number;
  estimatedStartAt: Date;
  estimatedEndAt: Date;
  machineNumber?: number | null;
  customer: {
    name: string;
  };
  service: {
    name: string;
  };
}

interface QueueBoardProps {
  queued: Order[];
  processing: Order[];
  ready: Order[];
  settings: Record<string, string>;
}

export default function QueueBoard({ queued, processing, ready, settings }: QueueBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Get occupied machine numbers from active processing orders
  const occupiedMachines = processing
    .map((o) => o.machineNumber)
    .filter((num): num is number => num !== null && num !== undefined);

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    setSelectedOrder(order);
    setNextStatus(status);
    setNote('');

    if (status === OrderStatus.PROCESSING) {
      const maxMachines = parseInt(settings.max_parallel_orders || '3', 10);
      const freeMachines = [];
      for (let i = 1; i <= maxMachines; i++) {
        if (!occupiedMachines.includes(i)) {
          freeMachines.push(i);
        }
      }
      setSelectedMachine(freeMachines[0] || null);
    } else {
      setSelectedMachine(null);
    }

    setShowModal(true);
  };

  const confirmStatusChange = () => {
    if (!selectedOrder || !nextStatus) return;
    setShowModal(false);

    startTransition(async () => {
      const res = await updateOrderStatus(
        selectedOrder.id,
        nextStatus,
        note || undefined,
        selectedMachine || undefined
      );
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  const renderOrderCard = (order: Order, actions: React.ReactNode) => (
    <div
      key={order.id}
      className="rounded-xl border border-border-brand bg-white p-4 shadow-xs hover:shadow-md transition-all space-y-3"
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-navy-dark">
          {order.orderCode}
        </span>
        <div className="flex gap-1.5 items-center">
          {order.machineNumber && (
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Mesin #{order.machineNumber}
            </span>
          )}
          <span className="text-[10px] font-bold text-emerald-brand bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full">
            #{order.queueNumber.toString().padStart(3, '0')}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-text-muted">
        <div className="flex items-center gap-1.5 font-semibold text-text-dark">
          <User size={13} className="text-text-muted" />
          {order.customer.name}
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <ShoppingBag size={13} />
          {order.service.name} ({order.weightKg} kg)
        </div>
        <div className="flex items-start gap-1.5 leading-tight">
          <Timer size={13} className="mt-0.5" />
          <div>
            {order.estimatedEndAt ? (
              <span className="font-semibold text-text-dark">
                Selesai: {formatDateTime(order.estimatedEndAt).split(', ')[1]}
              </span>
            ) : (
              <span>-</span>
            )}
            <span className="block text-[9px] text-text-muted">
              Mulai: {formatDateTime(order.estimatedStartAt)}
            </span>
          </div>
        </div>
      </div>

      {actions}
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Column 1: Queued */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-blue-200 pb-2">
          <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
            Antrean Masuk
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
              {queued.length}
            </span>
          </h3>
        </div>
        <div className="space-y-3 min-h-[300px] bg-blue-50/30 rounded-xl p-3 border border-blue-50">
          {queued.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-10">Antrean kosong.</p>
          ) : (
            queued.map((order) => {
              const maxMachines = parseInt(settings.max_parallel_orders || '3', 10);
              const isFull = occupiedMachines.length >= maxMachines;
              return renderOrderCard(
                order,
                <button
                  onClick={() => handleStatusChange(order, OrderStatus.PROCESSING)}
                  disabled={isPending || isFull}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-brand py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  <Play size={12} />
                  {isFull ? `Semua Mesin Penuh (${occupiedMachines.length}/${maxMachines})` : 'Mulai Cuci'}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2: Processing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-250 pb-2">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            Sedang Diproses
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs">
              {processing.length}
            </span>
          </h3>
        </div>
        <div className="space-y-3 min-h-[300px] bg-amber-50/20 rounded-xl p-3 border border-amber-50">
          {processing.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-10">Tidak ada pengerjaan aktif.</p>
          ) : (
            processing.map((order) =>
              renderOrderCard(
                order,
                <button
                  onClick={() => handleStatusChange(order, OrderStatus.READY)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-brand py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={12} />
                  Selesai Cuci
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* Column 3: Ready */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
          <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            Siap Diambil
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">
              {ready.length}
            </span>
          </h3>
        </div>
        <div className="space-y-3 min-h-[300px] bg-emerald-50/20 rounded-xl p-3 border border-emerald-50">
          {ready.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-10">Tidak ada paket siap ambil.</p>
          ) : (
            ready.map((order) =>
              renderOrderCard(
                order,
                <button
                  onClick={() => handleStatusChange(order, OrderStatus.PICKED_UP)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ClipboardCheck size={12} />
                  Serahkan
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* Custom Status Modal */}
      {showModal && selectedOrder && nextStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-border-brand">
            <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider mb-4 border-b border-border-brand pb-2">
              Konfirmasi Ubah Status
            </h3>
            
            <div className="space-y-4 text-xs">
              <p className="text-text-dark font-semibold">
                Ubah status pesanan <span className="font-extrabold text-navy-dark">{selectedOrder.orderCode}</span> menjadi:{' '}
                <span className="font-extrabold uppercase text-emerald-brand">
                  {nextStatus.toLowerCase().replace('_', ' ')}
                </span>
              </p>

              {/* Machine Selection Logic for PROCESSING */}
              {nextStatus === OrderStatus.PROCESSING && (() => {
                const maxMachines = parseInt(settings.max_parallel_orders || '3', 10);
                const freeMachines = [];
                for (let i = 1; i <= maxMachines; i++) {
                  if (!occupiedMachines.includes(i)) {
                    freeMachines.push(i);
                  }
                }
                const hasFreeMachines = freeMachines.length > 0;

                return (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-text-dark">PILIH MESIN CUCI</label>
                    {hasFreeMachines ? (
                      <div className="grid grid-cols-3 gap-2">
                        {freeMachines.map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSelectedMachine(num)}
                            className={`py-2 px-3 rounded-lg border text-center font-bold transition-all ${
                              selectedMachine === num
                                ? 'bg-emerald-brand border-emerald-brand text-white'
                                : 'bg-light-bg border-border-brand text-text-dark hover:bg-slate-100'
                            }`}
                          >
                            Mesin {num}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-600 leading-normal">
                        ⚠️ Semua mesin cuci sedang digunakan ({occupiedMachines.length}/{maxMachines} aktif).
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-text-dark mb-1.5">CATATAN STATUS (OPSIONAL)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Masukkan catatan log"
                  rows={2}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-border-brand py-2.5 text-xs font-bold text-text-muted hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={
                    nextStatus === OrderStatus.PROCESSING &&
                    (!selectedMachine || occupiedMachines.length >= parseInt(settings.max_parallel_orders || '3', 10))
                  }
                  className="flex-1 rounded-xl bg-emerald-brand py-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check size={14} />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
