'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateOrderEstimation } from '@/lib/estimation';
import { generateOrderCodeAndQueue } from '@/lib/order-code';
import { createMidtransTransaction, checkMidtransStatus } from '@/lib/midtrans';
import { OrderStatus, PaymentStatus, PaymentMethod, NotificationType, NotificationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay } from 'date-fns';
import { getAdminSession } from '@/lib/auth';


const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional().or(z.literal('')),
  serviceId: z.string().min(1, 'Service is required'),
  weightKg: z.coerce.number().gt(0, 'Weight must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional().or(z.literal('')),
});

export async function getDashboardStats() {
  try {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    // 1. Today's orders
    const todayOrdersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 2. Orders in queue (excluding unpaid cashless orders)
    const queuedCount = await prisma.order.count({
      where: {
        status: OrderStatus.QUEUED,
        NOT: {
          paymentMethod: { in: ['QRIS', 'TRANSFER', 'EWALLET'] },
          paymentStatus: 'UNPAID',
        },
      },
    });

    // 3. Orders in progress (excluding unpaid cashless orders)
    const processingCount = await prisma.order.count({
      where: {
        status: OrderStatus.PROCESSING,
        NOT: {
          paymentMethod: { in: ['QRIS', 'TRANSFER', 'EWALLET'] },
          paymentStatus: 'UNPAID',
        },
      },
    });

    // 4. Ready to pick up
    const readyCount = await prisma.order.count({
      where: { status: OrderStatus.READY },
    });

    // 5. Today's revenue
    const todayRevenueAggregate = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const todayRevenue = todayRevenueAggregate._sum.amount || 0;

    // 6. Active workload
    const activeWorkload = queuedCount + processingCount;

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 7. Last 7 days revenue for visual chart
    const revenueChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = startOfDay(d);
      const end = endOfDay(d);

      const revAggregate = await prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dayName = dayNames[d.getDay()];

      revenueChartData.push({
        label: dayName,
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: revAggregate._sum.amount || 0,
      });
    }

    return {
      todayOrdersCount,
      queuedCount,
      processingCount,
      readyCount,
      todayRevenue,
      activeWorkload,
      recentOrders,
      revenueChartData,
    };
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {
      todayOrdersCount: 0,
      queuedCount: 0,
      processingCount: 0,
      readyCount: 0,
      todayRevenue: 0,
      activeWorkload: 0,
      recentOrders: [],
      revenueChartData: [],
    };
  }

}

export async function getOrders(filters?: {
  search?: string;
  status?: OrderStatus;
  serviceId?: string;
}) {
  try {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters?.search) {
      where.OR = [
        { orderCode: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        payments: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    return null;
  }
}

export async function getOrderByCode(orderCode: string) {
  try {
    return await prisma.order.findUnique({
      where: { orderCode },
      include: {
        customer: true,
        service: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  } catch (err) {
    console.error('Error fetching order by code:', err);
    return null;
  }
}

export async function createOrder(data: {
  customerName: string;
  customerPhone?: string;
  serviceId: string;
  weightKg: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const validated = createOrderSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // 1. Fetch Service & Validate
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service || !service.isActive) {
      return { error: 'Selected laundry service is inactive or not found' };
    }

    // 2. Re-calculate Price
    const pricePerKg = service.pricePerKg;
    const totalPrice = pricePerKg * data.weightKg;

    // 3. Generate Code & Queue
    const { orderCode, queueNumber } = await generateOrderCodeAndQueue();

    // 4. Estimation engine
    const { estimatedDurationMinutes, estimatedStartAt, estimatedEndAt } =
      await calculateOrderEstimation(service.id, data.weightKg);

    // 5. Customer lookup or create
    let customer;
    if (data.customerPhone) {
      customer = await prisma.customer.findUnique({
        where: { phone: data.customerPhone },
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone || null,
        },
      });
    } else {
      // If customer exists but names differ slightly, update name optionally
      if (customer.name !== data.customerName) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { name: data.customerName },
        });
      }
    }

    // 6. Create Order (starts as UNPAID so QRIS/cashless orders must go through the payment gateway first)
    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceId: service.id,
        weightKg: data.weightKg,
        pricePerKg,
        totalPrice,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: data.paymentMethod,
        status: OrderStatus.QUEUED,
        queueNumber,
        estimatedDurationMinutes,
        estimatedStartAt,
        estimatedEndAt,
        notes: data.notes || null,
      },
    });

    // 7. Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalPrice,
        method: data.paymentMethod,
        status: PaymentStatus.UNPAID,
        paidAt: null,
      },
    });

    // 8. Order Status Log
    const session = await getAdminSession();
    const adminName = session?.name || 'Sistem';

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: OrderStatus.QUEUED,
        note: 'Order registered in system.',
        adminName,
      },
    });

    // 9. Initialize Midtrans Transaction for QRIS / Transfer
    let midtransToken = null;
    let midtransRedirectUrl = null;

    if (data.paymentMethod === PaymentMethod.QRIS || data.paymentMethod === PaymentMethod.TRANSFER) {
      try {
        const transaction = await createMidtransTransaction({
          orderId: orderCode, // Send the readable order code (e.g. LDY-xxxx) as order ID
          grossAmount: totalPrice,
          customerName: customer.name,
          customerPhone: customer.phone || undefined,
          serviceName: `${service.name} Laundry (${data.weightKg} kg)`,
        });

        midtransToken = transaction.token;
        midtransRedirectUrl = transaction.redirectUrl;
      } catch (err) {
        console.error('Error generating Midtrans token:', err);
      }
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/queue');
    return {
      success: true,
      orderCode,
      orderId: order.id,
      midtransToken,
      midtransRedirectUrl,
    };
  } catch (err) {
    console.error('Error creating order:', err);
    return { error: 'Failed to create order. Please try again.' };
  }
}


export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  note?: string,
  machineNumber?: number
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return { error: 'Order not found' };
    }

    // Simple transition validations
    const current = order.status;
    if (current === OrderStatus.PICKED_UP || current === OrderStatus.CANCELLED) {
      return { error: `Cannot change status of a ${current.toLowerCase()} order.` };
    }

    const data: any = { status: nextStatus };
    const now = new Date();

    if (nextStatus === OrderStatus.PROCESSING) {
      data.actualStartAt = order.actualStartAt || now;
      if (machineNumber !== undefined) {
        data.machineNumber = machineNumber;
      }
    } else if (nextStatus === OrderStatus.READY) {
      data.actualEndAt = now;
      data.readyAt = now;
      data.machineNumber = null; // Free up machine
    } else if (nextStatus === OrderStatus.CANCELLED || nextStatus === OrderStatus.PICKED_UP) {
      data.machineNumber = null; // Free up machine
    }

    if (nextStatus === OrderStatus.READY) {
      // Generate notification payload
      const msg = `Hello ${order.customer.name}, your laundry order [${order.orderCode}] is ready to pick up. Thank you.`;
      await prisma.notification.create({
        data: {
          orderId: order.id,
          type: NotificationType.SYSTEM,
          target: order.customer.phone || 'N/A',
          message: msg,
          status: NotificationStatus.PENDING,
        },
      });
    } else if (nextStatus === OrderStatus.PICKED_UP) {
      data.pickedUpAt = now;
      data.paymentStatus = PaymentStatus.PAID;

      // Update payment record to PAID if unpaid
      const unpaidPayment = await prisma.payment.findFirst({
        where: { orderId, status: PaymentStatus.UNPAID },
      });
      if (unpaidPayment) {
        await prisma.payment.update({
          where: { id: unpaidPayment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: now,
          },
        });
      }
    }

    // Save order update
    await prisma.order.update({
      where: { id: orderId },
      data,
    });

    // Write Log
    const session = await getAdminSession();
    const adminName = session?.name || 'Sistem';

    await prisma.orderStatusLog.create({
      data: {
        orderId,
        status: nextStatus,
        note: note || `Status updated to ${nextStatus.toLowerCase().replace('_', ' ')}.`,
        adminName,
      },
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/queue');
    revalidatePath(`/track/${order.orderCode}`);
    return { success: true };
  } catch (err) {
    console.error('Error updating order status:', err);
    return { error: 'Failed to update order status' };
  }
}

export async function markPaymentAsPaid(orderId: string, paymentMethod: PaymentMethod) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: 'Order not found' };
    }

    const now = new Date();

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod,
      },
    });

    // Update payments
    const payments = await prisma.payment.findMany({
      where: { orderId },
    });

    if (payments.length > 0) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          method: paymentMethod,
          paidAt: now,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          amount: order.totalPrice,
          method: paymentMethod,
          status: PaymentStatus.PAID,
          paidAt: now,
        },
      });
    }

    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/track/${order.orderCode}`);
    return { success: true };
  } catch (err) {
    console.error('Error marking payment as paid:', err);
    return { error: 'Failed to record payment' };
  }
}

export async function getOccupiedMachines() {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PROCESSING,
        machineNumber: { not: null },
      },
      select: {
        machineNumber: true,
      },
    });
    return activeOrders.map((o) => o.machineNumber as number);
  } catch (err) {
    console.error('Error fetching occupied machines:', err);
    return [];
  }
}

export async function getTrackingData(orderCode: string) {
  try {
    let order = await getOrderByCode(orderCode);
    if (!order) return null;

    const isCurrentCashlessUnpaid =
      (order.paymentMethod === 'QRIS' ||
        order.paymentMethod === 'TRANSFER' ||
        order.paymentMethod === 'EWALLET') &&
      order.paymentStatus === 'UNPAID';

    if (isCurrentCashlessUnpaid) {
      const midtransStatus = await checkMidtransStatus(orderCode);
      if (midtransStatus && (midtransStatus.transaction_status === 'settlement' || midtransStatus.transaction_status === 'capture')) {
        let method = order.paymentMethod;
        if (midtransStatus.payment_type === 'bank_transfer' || midtransStatus.payment_type === 'echannel') {
           method = PaymentMethod.TRANSFER;
        } else if (midtransStatus.payment_type === 'qris') {
           method = PaymentMethod.QRIS;
        }
        await markPaymentAsPaid(order.id, method);
        order = await getOrderByCode(orderCode); // Refresh order state
        if (!order) return null;
      }
    }

    let queuePosition = 0;
    const isStillCashlessUnpaid =
      (order.paymentMethod === 'QRIS' ||
        order.paymentMethod === 'TRANSFER' ||
        order.paymentMethod === 'EWALLET') &&
      order.paymentStatus === 'UNPAID';

    if (order.status === OrderStatus.QUEUED && !isStillCashlessUnpaid) {
      const olderQueuedCount = await prisma.order.count({
        where: {
          status: OrderStatus.QUEUED,
          createdAt: { lt: order.createdAt },
          NOT: {
            paymentMethod: { in: ['QRIS', 'TRANSFER', 'EWALLET'] },
            paymentStatus: 'UNPAID',
          },
        },
      });
      queuePosition = olderQueuedCount + 1;
    }

    return {
      order,
      queuePosition,
    };
  } catch (err) {
    console.error('Error in getTrackingData:', err);
    return null;
  }
}

export async function getMidtransTokenForOrder(orderCode: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!order) {
      return { error: 'Pesanan tidak ditemukan.' };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, alreadyPaid: true };
    }

    const transaction = await createMidtransTransaction({
      orderId: order.orderCode,
      grossAmount: order.totalPrice,
      customerName: order.customer.name,
      customerPhone: order.customer.phone || undefined,
      serviceName: `${order.service.name} Laundry (${order.weightKg} ${order.service.unit === 'ITEM' ? 'item' : 'kg'})`,
    });

    return {
      success: true,
      midtransToken: transaction.token,
      midtransRedirectUrl: transaction.redirectUrl,
    };
  } catch (err) {
    console.error('Error generating Midtrans token for order:', err);
    return { error: 'Gagal membuat sesi pembayaran Midtrans. Silakan coba lagi.' };
  }
}
