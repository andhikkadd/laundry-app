import React from 'react';
import ServicesDashboard from '@/components/admin/ServicesDashboard';
import { getServices } from '@/actions/services';
import { getSettings } from '@/actions/settings';
import { getOccupiedMachines } from '@/actions/orders';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const [services, settings, occupiedMachines] = await Promise.all([
    getServices(),
    getSettings(),
    getOccupiedMachines(),
  ]);

  return (
    <div className="space-y-6">
      <ServicesDashboard
        initialServices={services}
        settings={settings}
        occupiedMachines={occupiedMachines}
      />
    </div>
  );
}
