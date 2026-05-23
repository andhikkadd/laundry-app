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

  // 5. Sample Customers (Varied & Funny Names)
  const funnyNames = [
    'Ucup', 'Naruto Uzumaki', 'Ryan Gosling', 'Tok Dalang Ranggi', 
    'Fufufafa', 'Asep Knalpot', 'Budi Gaming', 'Siti Badriah', 
    'Elon Musk', 'Mamang Racing', 'Tony Stark', 'Patrick Star', 
    'Mbak Taylor', 'Kang Galon', 'Joko Mancing', 'Neng Siti',
    'Mas Pur', 'Lord Janda', 'Teh Ninih', 'Gojo Satoru'
  ];

  const dbCustomers = [];
  for (let i = 0; i < funnyNames.length; i++) {
    const cust = await prisma.customer.create({
      data: {
        name: funnyNames[i],
        phone: `0812${Math.floor(Math.random() * 90000000 + 10000000)}`,
      },
    });
    dbCustomers.push(cust);
  }
  console.log('Customers seeded with natural/funny names');

  // 6. Generate Realistic Historical Orders (Last 14 Days)
  const today = new Date();
  let orderCounter = 1;

  for (let i = 14; i >= 0; i--) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - i);
    currentDay.setHours(8, 0, 0, 0); // Start at 8 AM

    const dateStr = currentDay.getFullYear().toString() + 
                    (currentDay.getMonth() + 1).toString().padStart(2, '0') + 
                    currentDay.getDate().toString().padStart(2, '0');

    // Random number of orders per day (4 to 12), more on weekends
    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
    const numOrders = isWeekend ? Math.floor(Math.random() * 8) + 8 : Math.floor(Math.random() * 6) + 4;

    for (let j = 0; j < numOrders; j++) {
      const isExpress = Math.random() > 0.7;
      const service = isExpress ? expressService : regularService;
      const weight = Math.round((Math.random() * 7 + 1) * 10) / 10; // 1.0 to 8.0 kg
      const totalPrice = weight * service.pricePerKg;
      const duration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
      
      // Order created randomly during the day (8 AM to 7 PM)
      const orderTime = new Date(currentDay.getTime() + Math.random() * 11 * 60 * 60 * 1000);
      const endEst = new Date(orderTime.getTime() + duration * 60000);

      // Determine status based on probability and how old the order is
      let status: OrderStatus = OrderStatus.PICKED_UP;
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      
      const randCancel = Math.random();
      if (randCancel < 0.05) {
        // 5% chance order was cancelled
        status = OrderStatus.CANCELLED;
        paymentStatus = Math.random() > 0.5 ? PaymentStatus.UNPAID : PaymentStatus.REFUNDED;
      } else if (i === 0) { 
        // Today's active orders
        const rand = Math.random();
        if (rand < 0.25) status = OrderStatus.QUEUED;
        else if (rand < 0.55) status = OrderStatus.PROCESSING;
        else if (rand < 0.85) status = OrderStatus.READY;
        else status = OrderStatus.PICKED_UP;
        
        if (status === OrderStatus.QUEUED && Math.random() > 0.4) {
          paymentStatus = PaymentStatus.UNPAID;
        }
      }

      const paymentMethod = Math.random() > 0.4 ? PaymentMethod.QRIS : PaymentMethod.CASH;
      const customer = dbCustomers[Math.floor(Math.random() * dbCustomers.length)];

      const order = await prisma.order.create({
        data: {
          orderCode: `LDY-${dateStr}-${orderCounter.toString().padStart(4, '0')}`,
          customerId: customer.id,
          serviceId: service.id,
          weightKg: weight,
          pricePerKg: service.pricePerKg,
          totalPrice,
          paymentStatus,
          paymentMethod,
          status,
          queueNumber: orderCounter,
          estimatedDurationMinutes: duration,
          estimatedStartAt: orderTime,
          estimatedEndAt: endEst,
          actualStartAt: (status !== OrderStatus.QUEUED && status !== OrderStatus.CANCELLED) ? orderTime : null,
          actualEndAt: (status === OrderStatus.READY || status === OrderStatus.PICKED_UP) ? endEst : null,
          readyAt: (status === OrderStatus.READY || status === OrderStatus.PICKED_UP) ? endEst : null,
          pickedUpAt: status === OrderStatus.PICKED_UP ? new Date(endEst.getTime() + (Math.random() * 5 + 1) * 60 * 60 * 1000) : null,
          notes: Math.random() > 0.85 ? 'Tolong setrika yg rapi ya mang' : null,
          createdAt: orderTime,
        },
      });

      if (paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.REFUNDED) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: totalPrice,
            method: paymentMethod,
            status: paymentStatus,
            paidAt: orderTime,
            createdAt: orderTime,
          },
        });
      }

      // Create realistic logs
      const logs = [{ orderId: order.id, status: OrderStatus.QUEUED, createdAt: orderTime, note: 'Pesanan masuk antrean' }];
      
      if (status === OrderStatus.CANCELLED) {
        logs.push({ orderId: order.id, status: OrderStatus.CANCELLED, createdAt: new Date(orderTime.getTime() + 600000), note: 'Dibatalkan oleh pelanggan' });
      } else {
        if (status !== OrderStatus.QUEUED) logs.push({ orderId: order.id, status: OrderStatus.PROCESSING, createdAt: new Date(orderTime.getTime() + 5000), note: 'Mulai dicuci' });
        if (status === OrderStatus.READY || status === OrderStatus.PICKED_UP) logs.push({ orderId: order.id, status: OrderStatus.READY, createdAt: endEst, note: 'Selesai dan siap diambil' });
        if (status === OrderStatus.PICKED_UP) logs.push({ orderId: order.id, status: OrderStatus.PICKED_UP, createdAt: new Date(endEst.getTime() + 2 * 60 * 60 * 1000), note: 'Telah diambil pelanggan' });
      }

      await prisma.orderStatusLog.createMany({ data: logs });

      orderCounter++;
    }
  }

  console.log(`Generated ${orderCounter - 1} realistic historical orders for charts.`);
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
