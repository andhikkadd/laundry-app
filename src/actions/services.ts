'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  pricePerKg: z.number().min(0, 'Price cannot be negative'),
  baseDurationMinutes: z.number().min(1, 'Base duration must be at least 1 minute'),
  durationPerKgMinutes: z.number().min(0, 'Duration per kg cannot be negative'),
  isExpress: z.boolean().default(false),
  isActive: z.boolean().default(true),
  unit: z.string().default('KG'),
});

export async function getServices() {
  try {
    return await prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    return [];
  }
}

export async function createService(data: {
  name: string;
  slug: string;
  pricePerKg: number;
  baseDurationMinutes: number;
  durationPerKgMinutes: number;
  isExpress: boolean;
  isActive: boolean;
  unit: string;
}) {
  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const existing = await prisma.service.findFirst({
      where: {
        OR: [{ slug: data.slug }, { name: data.name }],
      },
    });

    if (existing) {
      return { error: 'Service name or slug already exists' };
    }

    const service = await prisma.service.create({
      data: validated.data,
    });

    revalidatePath('/admin/services');
    return { success: true, service };
  } catch (err) {
    console.error('Error creating service:', err);
    return { error: 'Failed to create service' };
  }
}

export async function updateService(
  id: string,
  data: {
    name: string;
    slug: string;
    pricePerKg: number;
    baseDurationMinutes: number;
    durationPerKgMinutes: number;
    isExpress: boolean;
    isActive: boolean;
    unit: string;
  }
) {
  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const existing = await prisma.service.findFirst({
      where: {
        OR: [{ slug: data.slug }, { name: data.name }],
        NOT: { id },
      },
    });

    if (existing) {
      return { error: 'Service name or slug already exists' };
    }

    const service = await prisma.service.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath('/admin/services');
    return { success: true, service };
  } catch (err) {
    console.error('Error updating service:', err);
    return { error: 'Failed to update service' };
  }
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  try {
    await prisma.service.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (err) {
    console.error('Error toggling service status:', err);
    return { error: 'Failed to update status' };
  }
}

export async function deleteService(id: string) {
  try {
    // Check if there are orders referencing this service
    const orderCount = await prisma.order.count({
      where: { serviceId: id },
    });

    if (orderCount > 0) {
      // If order exists, deactivate it instead
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath('/admin/services');
      return {
        success: true,
        message: 'Service is referenced by orders. Deactivated instead of deleted.',
      };
    }

    await prisma.service.delete({
      where: { id },
    });

    revalidatePath('/admin/services');
    return { success: true, message: 'Service deleted successfully' };
  } catch (err) {
    console.error('Error deleting service:', err);
    return { error: 'Failed to delete service' };
  }
}
