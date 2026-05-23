import React from 'react';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';
import { getAdminSession } from '@/lib/auth';
import { getSettings } from '@/actions/settings';

export const metadata = {
  title: 'Bilasin Admin Dashboard',
  description: 'Manage laundry queues, orders, settings, and generated revenue.',
};


export const dynamic = 'force-dynamic';


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([
    getAdminSession(),
    getSettings()
  ]);
  const adminName = session?.name || 'Admin';
  const adminEmail = session?.email || 'admin@bilasin.com';
  const outletName = settings?.outlet_name || 'Bilasin';

  return (
    <AdminLayoutShell adminName={adminName} adminEmail={adminEmail} outletName={outletName}>
      {children}
    </AdminLayoutShell>
  );
}
