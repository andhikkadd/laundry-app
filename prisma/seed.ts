import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear database
  await prisma.notification.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSetting.deleteMany();

  // 2. Admin User
  const passwordHash = await bcrypt.hash('admin12345', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Bilasin',
      email: 'bilasin@gmail.com',
      passwordHash,
      role: Role.ADMIN,

    },
  });
  console.log('Admin user seeded:', admin.email);

  // 3. Default Services
  const regularService = await prisma.service.create({
    data: {
      name: 'Regular',
      slug: 'regular',
      pricePerKg: 10000,
      baseDurationMinutes: 20,
      durationPerKgMinutes: 20,
      isExpress: false,
      isActive: true,
    },
  });

  const expressService = await prisma.service.create({
    data: {
      name: 'Express',
      slug: 'express',
      pricePerKg: 15000,
      baseDurationMinutes: 15,
      durationPerKgMinutes: 12,
      isExpress: true,
      isActive: true,
    },
  });
  console.log('Services seeded: Regular, Express');

  // 4. Default App Settings
  const settings = [
    { key: 'outlet_name', value: 'Bilasin' },
    { key: 'outlet_phone', value: '08123456789' },
    { key: 'outlet_address', value: 'Your Laundry Outlet' },
    { key: 'opening_hour', value: '08:00' },
    { key: 'closing_hour', value: '20:00' },
    { key: 'max_parallel_orders', value: '1' },
    { key: 'receipt_footer', value: 'Thank you for trusting Bilasin.' },
  ];

  for (const setting of settings) {
    await prisma.appSetting.create({
      data: setting,
    });
  }
  console.log('Settings seeded');

  // 5. Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Budi Santoso',
      phone: '081299998888',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Siti Rahma',
      phone: '085711112222',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Ahmad Faisal',
      phone: '087833334444',
    },
  });
  console.log('Customers seeded');

  // 6. Sample Orders
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + 
                  today.getDate().toString().padStart(2, '0');

  // Order 1: Completed
  const weight1 = 2.5;
  const totalPrice1 = weight1 * regularService.pricePerKg;
  const duration1 = regularService.baseDurationMinutes + Math.round(weight1 * regularService.durationPerKgMinutes);
  const start1 = new Date(today.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const end1 = new Date(start1.getTime() + duration1 * 60000);

  const order1 = await prisma.order.create({
    data: {
      orderCode: `LDY-${dateStr}-0001`,
      customerId: customer1.id,
      serviceId: regularService.id,
      weightKg: weight1,
      pricePerKg: regularService.pricePerKg,
      totalPrice: totalPrice1,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      status: OrderStatus.PICKED_UP,
      queueNumber: 1,
      estimatedDurationMinutes: duration1,
      estimatedStartAt: start1,
      estimatedEndAt: end1,
      actualStartAt: start1,
      actualEndAt: end1,
      readyAt: end1,
      pickedUpAt: new Date(end1.getTime() + 2 * 60 * 60 * 1000), // picked up 2 hours later
      notes: 'No hangers needed',
      createdAt: start1,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: totalPrice1,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      paidAt: start1,
      createdAt: start1,
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      { orderId: order1.id, status: OrderStatus.QUEUED, createdAt: start1, note: 'Order created' },
      { orderId: order1.id, status: OrderStatus.PROCESSING, createdAt: start1, note: 'Started washing' },
      { orderId: order1.id, status: OrderStatus.READY, createdAt: end1, note: 'Ready for pickup' },
      { orderId: order1.id, status: OrderStatus.PICKED_UP, createdAt: new Date(end1.getTime() + 2 * 60 * 60 * 1000), note: 'Picked up by customer' },
    ],
  });

  // Order 2: Processing
  const weight2 = 3.0;
  const totalPrice2 = weight2 * regularService.pricePerKg;
  const duration2 = regularService.baseDurationMinutes + Math.round(weight2 * regularService.durationPerKgMinutes);
  const start2 = new Date(today.getTime() - 30 * 60 * 1000); // 30 mins ago
  const end2 = new Date(start2.getTime() + duration2 * 60000);

  const order2 = await prisma.order.create({
    data: {
      orderCode: `LDY-${dateStr}-0002`,
      customerId: customer2.id,
      serviceId: regularService.id,
      weightKg: weight2,
      pricePerKg: regularService.pricePerKg,
      totalPrice: totalPrice2,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.QRIS,
      status: OrderStatus.PROCESSING,
      queueNumber: 2,
      estimatedDurationMinutes: duration2,
      estimatedStartAt: start2,
      estimatedEndAt: end2,
      actualStartAt: start2,
      notes: 'Fragile fabric, gentle wash',
      createdAt: start2,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: totalPrice2,
      method: PaymentMethod.QRIS,
      status: PaymentStatus.PAID,
      paidAt: start2,
      createdAt: start2,
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      { orderId: order2.id, status: OrderStatus.QUEUED, createdAt: start2, note: 'Order created' },
      { orderId: order2.id, status: OrderStatus.PROCESSING, createdAt: start2, note: 'Started washing' },
    ],
  });

  // Order 3: Queued
  const weight3 = 1.5;
  const totalPrice3 = weight3 * expressService.pricePerKg;
  const duration3 = expressService.baseDurationMinutes + Math.round(weight3 * expressService.durationPerKgMinutes);
  // starts when order 2 ends (based on single queue estimation logic)
  const start3 = end2;
  const end3 = new Date(start3.getTime() + duration3 * 60000);

  const order3 = await prisma.order.create({
    data: {
      orderCode: `LDY-${dateStr}-0003`,
      customerId: customer3.id,
      serviceId: expressService.id,
      weightKg: weight3,
      pricePerKg: expressService.pricePerKg,
      totalPrice: totalPrice3,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.TRANSFER,
      status: OrderStatus.QUEUED,
      queueNumber: 3,
      estimatedDurationMinutes: duration3,
      estimatedStartAt: start3,
      estimatedEndAt: end3,
      notes: 'Express service requested',
      createdAt: today,
    },
  });

  await prisma.orderStatusLog.create({
    data: {
      orderId: order3.id,
      status: OrderStatus.QUEUED,
      createdAt: today,
      note: 'Order created, waiting in queue',
    },
  });

  console.log('Sample orders seeded');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
