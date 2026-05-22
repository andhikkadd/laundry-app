'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  outlet_name: z.string().min(1, 'Outlet name is required'),
  outlet_phone: z.string().min(1, 'Outlet phone is required'),
  outlet_address: z.string().min(1, 'Outlet address is required'),
  opening_hour: z.string().min(1, 'Opening hour is required'),
  closing_hour: z.string().min(1, 'Closing hour is required'),
  max_parallel_orders: z.coerce.number().min(1, 'Max parallel orders must be at least 1'),
  receipt_footer: z.string().min(1, 'Receipt footer is required'),
});

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  } catch (err) {
    console.error('Error fetching settings:', err);
    return {};
  }
}

export async function updateSettings(data: Record<string, string>) {
  const validated = settingsSchema.safeParse({
    outlet_name: data.outlet_name,
    outlet_phone: data.outlet_phone,
    outlet_address: data.outlet_address,
    opening_hour: data.opening_hour,
    closing_hour: data.closing_hour,
    max_parallel_orders: data.max_parallel_orders,
    receipt_footer: data.receipt_footer,
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const promises = Object.entries(data).map(([key, value]) => {
      return prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(promises);
    revalidatePath('/admin/settings');
    revalidatePath('/admin/orders'); // receipt configurations cache revalidation
    revalidatePath('/admin/services');
    return { success: true };
  } catch (err) {
    console.error('Error updating settings:', err);
    return { error: 'Failed to update settings' };
  }
}

export async function updateMachineCapacity(capacity: number) {
  if (capacity < 1) {
    return { error: 'Kapasitas mesin cuci minimal 1' };
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: 'max_parallel_orders' },
      update: { value: capacity.toString() },
      create: { key: 'max_parallel_orders', value: capacity.toString() },
    });
    revalidatePath('/admin/settings');
    revalidatePath('/admin/services');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/queue');
    return { success: true };
  } catch (err) {
    console.error('Error updating machine capacity:', err);
    return { error: 'Gagal memperbarui kapasitas mesin cuci' };
  }
}
