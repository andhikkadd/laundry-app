import React from 'react';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';
import { getAdminSession } from '@/lib/auth';

export const metadata = {
  title: 'Bilasin Admin Dashboard',
  description: 'Manage laundry queues, orders, settings, and generated revenue.',
};


export const dynamic = 'force-dynamic';


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const adminName = session?.name || 'Admin Bilasin';

  return (
    <AdminLayoutShell adminName={adminName}>
      {children}
    </AdminLayoutShell>
  );
}
