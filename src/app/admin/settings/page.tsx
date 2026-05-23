import React from 'react';
import SettingsForm from '@/components/admin/SettingsForm';
import { getSettings } from '@/actions/settings';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [settings, staffList] = await Promise.all([
    getSettings(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const serializedStaff = staffList.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <SettingsForm initialSettings={settings} initialStaff={serializedStaff} />
    </div>
  );
}
