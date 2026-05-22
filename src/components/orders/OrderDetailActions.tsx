'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus, markPaymentAsPaid } from '@/actions/orders';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import StatusBadge from '../ui/StatusBadge';
import PaymentBadge from '../ui/PaymentBadge';
import OrderTimeline from './OrderTimeline';
import { formatPrice, formatDateTime } from '@/lib/format';
import {
  Printer,
  CheckCircle,
  Play,
  ClipboardCheck,
  XCircle,
  CreditCard,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  Download,
} from 'lucide-react';

interface OrderDetailActionsProps {
  order: any;
  settings: Record<string, string>;
  trackingUrl: string;
  qrCodeDataUrl: string;
  occupiedMachines?: number[];
  queuePosition?: number;
}

export default function OrderDetailActions({
  order,
  settings,
  trackingUrl,
  qrCodeDataUrl,
  occupiedMachines = [],
  queuePosition = 0,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // Custom Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToChange, setStatusToChange] = useState<OrderStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);

  const handleStatusChange = (nextStatus: OrderStatus) => {
    setError(null);
    setSuccessMsg(null);
    setStatusToChange(nextStatus);
    setStatusNote('');

    // Pre-populate/initialize machine list for PROCESSING
    if (nextStatus === OrderStatus.PROCESSING) {
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
    
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (!statusToChange) return;
    setError(null);
    setSuccessMsg(null);
    setShowStatusModal(false);

    startTransition(async () => {
      const res = await updateOrderStatus(
        order.id,
        statusToChange,
        statusNote || undefined,
        selectedMachine || undefined
      );
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(`Status berhasil diubah menjadi ${statusToChange.toLowerCase().replace('_', ' ')}`);
        router.refresh();
      }
    });
  };

  const handlePaymentSubmit = () => {
    setError(null);
    setSuccessMsg(null);
    setShowPaymentModal(false);

    startTransition(async () => {
      const res = await markPaymentAsPaid(order.id, paymentMethod);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg('Pembayaran berhasil dicatat.');
        router.refresh();
      }
    });
  };

  const copyWhatsAppMessage = () => {
    const msg = `Halo ${order.customer.name}, laundry Anda dengan kode order *${order.orderCode}* sudah SIAP untuk diambil di outlet *${settings.outlet_name || 'Bilasin'}*. Terima kasih.`;
    navigator.clipboard.writeText(msg);
    alert('Pesan WhatsApp disalin ke clipboard!');
  };

  const downloadReceiptAsImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 300;
    const lineHeight = 18;

    // Load QR Code image
    const qrImg = new Image();
    qrImg.src = qrCodeDataUrl;

    qrImg.onload = () => {
      // Define lines of receipt
      const lines: Array<
        | { type: 'text'; content: string; align?: 'center' | 'left'; bold?: boolean }
        | { type: 'dashed' }
        | { type: 'spacing'; height: number }
        | { type: 'columns'; left: string; right: string; bold?: boolean }
        | { type: 'qr' }
      > = [
        { type: 'text', content: settings.outlet_name || 'Bilasin', align: 'center', bold: true },
        { type: 'text', content: settings.outlet_address || 'Your Laundry Outlet', align: 'center' },
        { type: 'text', content: `Telp: ${settings.outlet_phone || '08123456789'}`, align: 'center' },
        { type: 'dashed' },
        { type: 'text', content: `No Resi: ${order.orderCode}`, bold: true },
        { type: 'text', content: `No Antrean: #${order.queueNumber.toString().padStart(3, '0')}`, bold: true },
        { type: 'text', content: `Tgl Masuk: ${formatDateTime(order.createdAt)}` },
        { type: 'dashed' },
        { type: 'text', content: `Pelanggan: ${order.customer.name}`, bold: true },
        { type: 'text', content: `No Telp: ${order.customer.phone || '-'}` },
        { type: 'dashed' },
        { type: 'text', content: `Paket: ${order.service.name}` },
        { type: 'columns', left: order.service.unit === 'ITEM' ? 'Jumlah:' : 'Berat:', right: `${order.weightKg} ${order.service.unit === 'ITEM' ? 'item' : 'kg'}` },
        { type: 'columns', left: order.service.unit === 'ITEM' ? 'Harga/Item:' : 'Harga/Kg:', right: formatPrice(order.pricePerKg) },
        { type: 'dashed' },
        { type: 'columns', left: 'Total Bayar:', right: formatPrice(order.totalPrice), bold: true },
        { type: 'columns', left: 'Status:', right: `${order.paymentStatus} (${order.paymentMethod})` },
        { type: 'dashed' },
        { type: 'text', content: 'Pindai QR ini untuk melacak status:', align: 'center' },
        { type: 'qr' },
        { type: 'dashed' },
        { type: 'text', content: settings.receipt_footer || 'Terima kasih atas kepercayaan Anda.', align: 'center' },
        { type: 'spacing', height: 4 },
        { type: 'text', content: 'Powered by Bilasin', align: 'center' },
      ];

      // Calculate height
      let totalHeight = 40; // padding
      lines.forEach((line) => {
        if (line.type === 'text') totalHeight += lineHeight;
        else if (line.type === 'columns') totalHeight += lineHeight;
        else if (line.type === 'dashed') totalHeight += 12;
        else if (line.type === 'spacing') totalHeight += line.height;
        else if (line.type === 'qr') totalHeight += 110;
      });

      canvas.width = width;
      canvas.height = totalHeight;

      // Draw Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, totalHeight);

      // Draw Text
      ctx.fillStyle = '#000000';
      let y = 20;

      lines.forEach((line) => {
        if (line.type === 'text') {
          ctx.font = line.bold ? 'bold 11px Courier New, monospace' : '11px Courier New, monospace';
          const text = line.content;
          if (line.align === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(text, width / 2, y + 10);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(text, 15, y + 10);
          }
          y += lineHeight;
        } else if (line.type === 'columns') {
          ctx.font = line.bold ? 'bold 11px Courier New, monospace' : '11px Courier New, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(line.left, 15, y + 10);
          ctx.textAlign = 'right';
          ctx.fillText(line.right, width - 15, y + 10);
          y += lineHeight;
        } else if (line.type === 'dashed') {
          ctx.strokeStyle = '#000000';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(15, y + 6);
          ctx.lineTo(width - 15, y + 6);
          ctx.stroke();
          y += 12;
        } else if (line.type === 'spacing') {
          y += line.height;
        } else if (line.type === 'qr') {
          ctx.drawImage(qrImg, (width - 100) / 2, y, 100, 100);
          y += 110;
        }
      });

      // Download
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `struk-${order.orderCode}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error generating image', err);
        alert('Gagal mendownload struk sebagai gambar.');
      }
    };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Detail information (Left side) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Status Alert and Messages */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-600">
            {successMsg}
          </div>
        )}

        {/* Info card */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-brand pb-4">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">KODE INVOICE</span>
              <h2 className="text-xl font-black text-navy-dark tracking-tight">{order.orderCode}</h2>
              <span className="text-[10px] text-text-muted mt-0.5 flex flex-wrap items-center gap-2">
                <span>No. Antrean: <span className="font-extrabold text-navy-dark text-xs">#{order.queueNumber.toString().padStart(3, '0')}</span></span>
                {order.status === OrderStatus.QUEUED && queuePosition > 0 && (
                  <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[9px] font-bold border border-blue-200">
                    Antrean ke-{queuePosition}
                  </span>
                )}
                {order.status === OrderStatus.PROCESSING && order.machineNumber && (
                  <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-bold border border-amber-250 animate-pulse">
                    Mesin Cuci #{order.machineNumber}
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Customer / Service grids */}
          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            <div>
              <h4 className="font-bold text-navy-dark uppercase tracking-wider mb-2">Data Pelanggan</h4>
              <p className="font-semibold text-text-dark">{order.customer.name}</p>
              <p className="text-text-muted mt-1">{order.customer.phone || 'Tidak ada no. telepon'}</p>
            </div>
            <div>
              <h4 className="font-bold text-navy-dark uppercase tracking-wider mb-2">Detail Layanan</h4>
              <p className="font-semibold text-text-dark">{order.service.name}</p>
              <p className="text-text-muted mt-1">{order.weightKg} kg @ {formatPrice(order.pricePerKg)}/kg</p>
              <p className="font-extrabold text-emerald-brand mt-1 text-sm">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>

          {/* Estimations vs actuals */}
          <div className="grid gap-6 sm:grid-cols-2 border-t border-border-brand pt-4 text-xs">
            <div>
              <h4 className="font-bold text-navy-dark uppercase tracking-wider mb-2">Estimasi Waktu</h4>
              <p className="text-text-muted">Mulai: <span className="font-semibold text-text-dark">{formatDateTime(order.estimatedStartAt)}</span></p>
              <p className="text-text-muted mt-1">Selesai: <span className="font-semibold text-text-dark">{formatDateTime(order.estimatedEndAt)}</span></p>
              <p className="text-text-muted mt-1">Durasi: <span className="font-semibold text-text-dark">{order.estimatedDurationMinutes} menit</span></p>
            </div>
            <div>
              <h4 className="font-bold text-navy-dark uppercase tracking-wider mb-2">Realisasi Waktu</h4>
              <p className="text-text-muted">Mulai: <span className="font-semibold text-text-dark">{formatDateTime(order.actualStartAt)}</span></p>
              <p className="text-text-muted mt-1">Selesai: <span className="font-semibold text-text-dark">{formatDateTime(order.actualEndAt)}</span></p>
              {order.pickedUpAt && (
                <p className="text-text-muted mt-1">Diambil: <span className="font-semibold text-text-dark">{formatDateTime(order.pickedUpAt)}</span></p>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="border-t border-border-brand pt-4 text-xs">
              <h4 className="font-bold text-navy-dark uppercase tracking-wider mb-1.5">Catatan Khusus</h4>
              <p className="bg-light-bg p-3 rounded-lg border border-border-brand italic font-medium text-text-dark leading-relaxed">
                &quot;{order.notes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Status Log Timeline */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider">Perjalanan Cucian</h3>
          <div className="pt-2">
            <OrderTimeline currentStatus={order.status} logs={order.statusLogs} />
          </div>
        </div>
      </div>

      {/* Control panel (Right side) */}
      <div className="space-y-6">
        
        {/* Actions panel */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
            Panel Kontrol
          </h3>

          <div className="flex flex-col gap-3">
            {/* 1. Mark as processing */}
            {order.status === OrderStatus.QUEUED && (() => {
              const maxMachines = parseInt(settings.max_parallel_orders || '3', 10);
              const busyCount = occupiedMachines.length;
              const isFull = busyCount >= maxMachines;
              return (
                <button
                  onClick={() => handleStatusChange(OrderStatus.PROCESSING)}
                  disabled={isPending || isFull}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-brand py-3 text-xs font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  <Play size={14} />
                  {isFull ? `Semua Mesin Penuh (${busyCount}/${maxMachines})` : 'Mulai Proses (Washing)'}
                </button>
              );
            })()}

            {/* 2. Mark as ready */}
            {order.status === OrderStatus.PROCESSING && (
              <button
                onClick={() => handleStatusChange(OrderStatus.READY)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 disabled:opacity-50"
              >
                <CheckCircle size={14} />
                Selesai (Siap Diambil)
              </button>
            )}

            {/* 3. Mark as picked up */}
            {order.status === OrderStatus.READY && (
              <button
                onClick={() => handleStatusChange(OrderStatus.PICKED_UP)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
              >
                <ClipboardCheck size={14} />
                Serahkan & Ambil
              </button>
            )}

            {/* 4. Payment Trigger */}
            {order.paymentStatus === PaymentStatus.UNPAID && (
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                <CreditCard size={14} />
                Catat Pelunasan Bayar
              </button>
            )}

            {/* Cancel order */}
            {(order.status === OrderStatus.QUEUED || order.status === OrderStatus.PROCESSING) && (
              <button
                onClick={() => handleStatusChange(OrderStatus.CANCELLED)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                <XCircle size={14} />
                Batalkan Pesanan
              </button>
            )}

            {/* Print button */}
            <button
              onClick={() => setShowReceiptPreview(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border-brand bg-white py-3 text-xs font-bold text-text-dark hover:bg-slate-50"
            >
              <Printer size={14} />
              Cetak Struk Nota
            </button>

            {/* Copy Whatsapp Template */}
            {order.status === OrderStatus.READY && (
              <button
                onClick={copyWhatsAppMessage}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600/10 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-600/20"
              >
                <Copy size={14} />
                Salin Template WA
              </button>
            )}
          </div>
        </div>

        {/* Public Tracking Link card */}
        <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider">Tautan Pelacakan</h3>
          <div className="flex flex-col items-center text-center space-y-3">
            <img src={qrCodeDataUrl} alt="Tracking QR Code" className="border border-border-brand rounded-lg p-1.5 w-40 h-40 bg-white" />
            <div className="flex w-full items-center gap-2 rounded-xl border border-border-brand bg-light-bg px-3 py-2 text-[11px]">
              <span className="truncate font-semibold text-text-dark flex-1 break-all select-all text-left">
                {trackingUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(trackingUrl);
                  alert('Tautan pelacakan berhasil disalin ke clipboard!');
                }}
                className="text-[10px] font-bold text-emerald-brand hover:text-emerald-600 transition-colors shrink-0"
              >
                Salin
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Status Transition Modal */}
      {showStatusModal && statusToChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-border-brand">
            <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider mb-4 border-b border-border-brand pb-2">
              Konfirmasi Ubah Status
            </h3>
            
            <div className="space-y-4 text-xs">
              <p className="text-text-dark font-semibold">
                Ubah status pesanan <span className="font-extrabold text-navy-dark">{order.orderCode}</span> menjadi:{' '}
                <span className="font-extrabold uppercase text-emerald-brand">
                  {statusToChange.toLowerCase().replace('_', ' ')}
                </span>
              </p>

              {/* Machine Selection Logic for PROCESSING */}
              {statusToChange === OrderStatus.PROCESSING && (() => {
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
                        ⚠️ Semua mesin cuci sedang digunakan ({occupiedMachines.length}/{maxMachines} aktif). Selesaikan cucian lain terlebih dahulu untuk membebaskan mesin.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-text-dark mb-1.5">CATATAN STATUS (OPSIONAL)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Masukkan catatan log (misal: Mulai mencuci reguler)"
                  rows={2}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 rounded-xl border border-border-brand py-2.5 text-xs font-bold text-text-muted hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={
                    statusToChange === OrderStatus.PROCESSING &&
                    (!selectedMachine || !occupiedMachines || occupiedMachines.length >= parseInt(settings.max_parallel_orders || '3', 10))
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-border-brand">
            <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider mb-4 border-b border-border-brand pb-2">
              Pencatatan Pembayaran
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-dark mb-2">METODE BAYAR</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:outline-hidden font-medium"
                >
                  <option value={PaymentMethod.CASH}>Tunai / Cash</option>
                  <option value={PaymentMethod.TRANSFER}>Transfer Bank</option>
                  <option value={PaymentMethod.QRIS}>QRIS</option>
                  <option value={PaymentMethod.EWALLET}>E-Wallet</option>
                </select>
              </div>

              <div className="text-xs bg-light-bg p-3 rounded-lg border border-border-brand">
                Total Tagihan: <span className="font-extrabold text-emerald-brand">{formatPrice(order.totalPrice)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 rounded-xl border border-border-brand py-2 text-xs font-bold text-text-muted hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="flex-1 rounded-xl bg-emerald-brand py-2 text-xs font-bold text-white hover:bg-emerald-600 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Simpan Lunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs overflow-y-auto py-10 px-4 no-print">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
                Pratinjau Nota Belanja
              </h3>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="text-text-muted hover:text-navy-dark text-lg font-bold select-none"
              >
                &times;
              </button>
            </div>

            {/* Thermal Receipt Paper Roll Preview */}
            <div className="p-6 bg-slate-50/50 flex justify-center border-b border-slate-100">
              <div className="w-full bg-white p-5 shadow-md border border-slate-200/60 rounded-sm font-mono text-[11px] text-slate-800 space-y-4 max-w-[280px]">
                {/* Outlet Header */}
                <div className="text-center">
                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight">{settings.outlet_name || 'Bilasin'}</h4>
                  <p className="text-[10px] text-slate-600 mt-1">{settings.outlet_address || 'Your Laundry Outlet'}</p>
                  <p className="text-[10px] text-slate-600">Telp: {settings.outlet_phone || '08123456789'}</p>
                </div>
                
                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* Order Meta */}
                <div className="space-y-1">
                  <p>No Resi: <span className="font-bold text-slate-900">{order.orderCode}</span></p>
                  <p>No Antrean: <span className="font-bold text-slate-900">#{order.queueNumber.toString().padStart(3, '0')}</span></p>
                  <p>Tgl Masuk: {formatDateTime(order.createdAt)}</p>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* Customer Meta */}
                <div className="space-y-0.5">
                  <p>Pelanggan: <span className="font-bold text-slate-900">{order.customer.name}</span></p>
                  <p>No Telp: {order.customer.phone || '-'}</p>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* Line Items */}
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="py-1">Paket: {order.service.name}</td>
                      <td className="text-right py-1 font-bold">{order.weightKg} {(order.service.unit || 'KG').toLowerCase()}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">{order.service.unit === 'ITEM' ? 'Harga/Item:' : 'Harga/Kg:'}</td>
                      <td className="text-right py-0.5 font-bold">{formatPrice(order.pricePerKg)}</td>
                    </tr>
                    <tr className="border-t border-dashed border-slate-400">
                      <td className="py-1.5 font-bold text-slate-900">Total Bayar:</td>
                      <td className="text-right py-1.5 font-extrabold text-slate-900">{formatPrice(order.totalPrice)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">Status:</td>
                      <td className="text-right py-0.5 font-bold uppercase text-slate-900">{order.paymentStatus} ({order.paymentMethod})</td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* QR Tracking */}
                <div className="text-center space-y-2">
                  <p className="text-[9px] text-slate-500">Pindai QR ini untuk melacak status laundry:</p>
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-24 h-24 mx-auto border border-slate-200 p-1 bg-white rounded-xs" 
                  />
                  <p className="italic text-[9px] text-slate-600 leading-tight mt-2">{settings.receipt_footer || 'Terima kasih atas kepercayaan Anda.'}</p>
                  <p className="text-[8px] text-slate-400 mt-1">Powered by Bilasin</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 p-4 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={downloadReceiptAsImage}
                className="flex-1 rounded-xl border border-amber-brand/35 bg-amber-brand/5 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-brand/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                Unduh PNG
              </button>
              <button
                onClick={() => {
                  document.body.classList.add('print-receipt-mode');
                  window.print();
                  setTimeout(() => {
                    document.body.classList.remove('print-receipt-mode');
                  }, 1000);
                }}
                className="flex-1 rounded-xl bg-emerald-brand py-2.5 text-xs font-bold text-white hover:bg-emerald-600 flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm transition-colors"
              >
                <Printer size={14} />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA ONLY VISIBLE IN WINDOW.PRINT() */}
      <div id="print-receipt-area" className="hidden">
        <div style={{ fontFamily: 'monospace', maxWidth: '300px', margin: '0 auto', fontSize: '12px', color: 'black' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>{settings.outlet_name || 'Bilasin'}</h3>
            <p style={{ margin: '0 0 3px 0' }}>{settings.outlet_address || 'Your Laundry Outlet'}</p>
            <p style={{ margin: '0' }}>Telp: {settings.outlet_phone || '08123456789'}</p>
          </div>
          <div style={{ borderTop: '1px dashed black', padding: '10px 0' }}>
            <p style={{ margin: '0 0 5px 0' }}>No Resi: <strong>{order.orderCode}</strong></p>
            <p style={{ margin: '0 0 5px 0' }}>No Antrean: <strong>#{order.queueNumber.toString().padStart(3, '0')}</strong></p>
            <p style={{ margin: '0' }}>Tgl Masuk: {formatDateTime(order.createdAt)}</p>
          </div>
          <div style={{ borderTop: '1px dashed black', padding: '10px 0' }}>
            <p style={{ margin: '0 0 5px 0' }}>Pelanggan: {order.customer.name}</p>
            <p style={{ margin: '0' }}>No Telp: {order.customer.phone || '-'}</p>
          </div>
          <div style={{ borderTop: '1px dashed black', padding: '10px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0' }}>Paket: {order.service.name}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>{order.weightKg} {(order.service.unit || 'KG').toLowerCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>{order.service.unit === 'ITEM' ? 'Harga/Item:' : 'Harga/Kg:'}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatPrice(order.pricePerKg)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ padding: '5px 0 3px 0', borderTop: '1px dashed black' }}>Total Bayar:</td>
                  <td style={{ textAlign: 'right', padding: '5px 0 3px 0', borderTop: '1px dashed black' }}>{formatPrice(order.totalPrice)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Status:</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', textTransform: 'uppercase' }}>{order.paymentStatus} ({order.paymentMethod})</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: '1px dashed black', padding: '10px 0', textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '10px' }}>Pindai QR ini untuk melacak status laundry:</p>
            <img src={qrCodeDataUrl} alt="QR Code" style={{ width: '100px', height: '100px', margin: '0 auto 10px auto', display: 'block' }} />
            <p style={{ margin: '0 0 5px 0', fontStyle: 'italic' }}>{settings.receipt_footer || 'Terima kasih atas kepercayaan Anda.'}</p>
            <p style={{ margin: '0', fontSize: '9px', color: 'grey' }}>Powered by Bilasin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
