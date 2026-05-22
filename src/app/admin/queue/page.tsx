import React from 'react';
import QueueBoard from '@/components/admin/QueueBoard';
import { getOrders } from '@/actions/orders';
import { getSettings } from '@/actions/settings';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminQueuePage() {
  const [allOrders, settings] = await Promise.all([
    getOrders(),
    getSettings(),
  ]);

  // Filter orders for active states
  const queued = allOrders.filter((o) => o.status === OrderStatus.QUEUED);
  const processing = allOrders.filter((o) => o.status === OrderStatus.PROCESSING);
  const ready = allOrders.filter((o) => o.status === OrderStatus.READY);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">
          Pindahkan status cucian dari Antrean, Proses pencucian, hingga Siap untuk diambil.
        </p>
      </div>
      <QueueBoard queued={queued} processing={processing} ready={ready} settings={settings} />
    </div>
  );
}
