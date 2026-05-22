'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PaymentStatus, OrderStatus } from '@prisma/client';

export async function getReportsData() {
  try {
    const now = new Date();

    const startToday = startOfDay(now);
    const endToday = endOfDay(now);

    const startWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endWeek = endOfWeek(now, { weekStartsOn: 1 });

    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    // 1. Revenue Today
    const paymentsToday = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startToday,
          lte: endToday,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const revenueToday = paymentsToday._sum.amount || 0;

    // 2. Revenue This Week
    const paymentsWeek = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startWeek,
          lte: endWeek,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const revenueThisWeek = paymentsWeek._sum.amount || 0;

    // 3. Revenue This Month
    const paymentsMonth = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const revenueThisMonth = paymentsMonth._sum.amount || 0;

    // 4. Completed Orders This Month
    const completedOrdersThisMonth = await prisma.order.count({
      where: {
        status: OrderStatus.PICKED_UP,
        pickedUpAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    // 5. Total orders this month (all statuses)
    const totalOrdersThisMonth = await prisma.order.count({
      where: {
        createdAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    // 6. Total weight this month
    const weightThisMonth = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      _sum: {
        weightKg: true,
      },
    });
    const totalWeightKgThisMonth = weightThisMonth._sum.weightKg || 0;

    // 7. Most Used Service
    const serviceCounts = await prisma.order.groupBy({
      by: ['serviceId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    });

    let mostUsedService = 'Belum ada';
    if (serviceCounts.length > 0) {
      const service = await prisma.service.findUnique({
        where: { id: serviceCounts[0].serviceId },
      });
      if (service) {
        mostUsedService = `${service.name} (${serviceCounts[0]._count.id} pesanan)`;
      }
    }

    // 8. Service distribution for chart
    const allServiceCounts = await prisma.order.groupBy({
      by: ['serviceId'],
      where: {
        createdAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      _count: { id: true },
    });

    const allServices = await prisma.service.findMany();
    const serviceDistribution = allServiceCounts.map((sc) => {
      const svc = allServices.find((s) => s.id === sc.serviceId);
      return {
        name: svc?.name || 'Unknown',
        count: sc._count.id,
      };
    }).sort((a, b) => b.count - a.count);

    // 9. Daily revenue for last 14 days
    const dailyRevenue: { date: string; label: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayPayments = await prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      });

      dailyRevenue.push({
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'dd MMM', { locale: localeId }),
        revenue: dayPayments._sum.amount || 0,
      });
    }

    // 10. Status distribution this month
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startMonth, lte: endMonth },
      },
      _count: { id: true },
    });

    const statusDistribution = statusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.id,
    }));

    // 11. Recent Paid Transactions (last 15)
    const recentTransactions = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
      },
      include: {
        order: {
          include: {
            customer: true,
            service: true,
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
      take: 15,
    });

    return {
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      completedOrdersThisMonth,
      totalOrdersThisMonth,
      totalWeightKgThisMonth,
      mostUsedService,
      serviceDistribution,
      dailyRevenue,
      statusDistribution,
      recentTransactions,
    };
  } catch (err) {
    console.error('Error generating reports:', err);
    return {
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
      completedOrdersThisMonth: 0,
      totalOrdersThisMonth: 0,
      totalWeightKgThisMonth: 0,
      mostUsedService: 'Error',
      serviceDistribution: [],
      dailyRevenue: [],
      statusDistribution: [],
      recentTransactions: [],
    };
  }
}
