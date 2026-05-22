import { prisma } from './prisma';
import { OrderStatus } from '@prisma/client';

export async function calculateOrderEstimation(serviceId: string, weightKg: number) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new Error('Service not found or inactive');
  }

  // Formula: baseDuration + (weight * durationPerKg)
  const estimatedDurationMinutes = service.baseDurationMinutes + Math.round(weightKg * service.durationPerKgMinutes);

  const now = new Date();
  
  // Find active orders that are currently queued or processing
  const latestActiveOrder = await prisma.order.findFirst({
    where: {
      status: {
        in: [OrderStatus.QUEUED, OrderStatus.PROCESSING],
      },
    },
    orderBy: {
      estimatedEndAt: 'desc',
    },
  });

  let estimatedStartAt = now;

  if (latestActiveOrder) {
    // If the latest active order ends in the future, start after it.
    // If it was supposed to end in the past but hasn't updated yet, default to now.
    estimatedStartAt = latestActiveOrder.estimatedEndAt > now ? latestActiveOrder.estimatedEndAt : now;
  }

  const estimatedEndAt = new Date(estimatedStartAt.getTime() + estimatedDurationMinutes * 60000);

  return {
    estimatedDurationMinutes,
    estimatedStartAt,
    estimatedEndAt,
  };
}
