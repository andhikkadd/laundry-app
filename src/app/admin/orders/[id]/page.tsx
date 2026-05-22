import React from 'react';
import { notFound } from 'next/navigation';
import { getOrderById, getOccupiedMachines } from '@/actions/orders';
import { getSettings } from '@/actions/settings';
import { generateQRCode } from '@/lib/qrcode';
import OrderDetailActions from '@/components/orders/OrderDetailActions';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const [order, settings, occupiedMachines] = await Promise.all([
    getOrderById(id),
    getSettings(),
    getOccupiedMachines(),
  ]);

  if (!order) {
    return notFound();
  }

  // Calculate position in queue for transparency
  let queuePosition = 0;
  if (order.status === OrderStatus.QUEUED) {
    const olderQueuedCount = await prisma.order.count({
      where: {
        status: OrderStatus.QUEUED,
        createdAt: { lt: order.createdAt },
      },
    });
    queuePosition = olderQueuedCount + 1;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/track/${order.orderCode}`;

  // Generate QR Code server-side
  const qrCodeDataUrl = await generateQRCode(trackingUrl);

  return (
    <OrderDetailActions
      order={order}
      settings={settings}
      trackingUrl={trackingUrl}
      qrCodeDataUrl={qrCodeDataUrl}
      occupiedMachines={occupiedMachines}
      queuePosition={queuePosition}
    />
  );
}
