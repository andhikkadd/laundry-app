import React from 'react';
import SettingsForm from '@/components/admin/SettingsForm';
import { getSettings } from '@/actions/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
