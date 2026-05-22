'use server';

import { prisma } from '@/lib/prisma';

export async function getCustomers(searchQuery?: string) {
  try {
    const whereClause = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as any } },
            { phone: { contains: searchQuery, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: {
          select: {
            id: true,
            totalPrice: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map((c) => {
      const totalOrders = c.orders.length;
      const totalSpend = c.orders.reduce((sum, o) => sum + o.totalPrice, 0);
      const sortedOrders = [...c.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '-',
        totalOrders,
        totalSpend,
        lastOrderDate,
        createdAt: c.createdAt,
      };
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
}

export async function getCustomerDetail(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            service: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) return null;

    const totalOrders = customer.orders.length;
    const totalSpend = customer.orders.reduce((sum, o) => sum + o.totalPrice, 0);

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '-',
      totalOrders,
      totalSpend,
      orders: customer.orders,
      createdAt: customer.createdAt,
    };
  } catch (err) {
    console.error('Error fetching customer details:', err);
    return null;
  }
}
