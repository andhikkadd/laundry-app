import React from 'react';
import { notFound } from 'next/navigation';
import { getTrackingData } from '@/actions/orders';
import OrderTrackerClient from '@/components/orders/OrderTrackerClient';

interface TrackDetailProps {
  params: Promise<{ orderCode: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TrackDetailPage({ params }: TrackDetailProps) {
  const { orderCode } = await params;
  const trackingData = await getTrackingData(orderCode);

  if (!trackingData) {
    return notFound();
  }

  return (
    <OrderTrackerClient
      orderCode={orderCode}
      initialOrder={trackingData.order}
      initialQueuePosition={trackingData.queuePosition}
      midtransClientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
      isProduction={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'}
    />
  );
}
