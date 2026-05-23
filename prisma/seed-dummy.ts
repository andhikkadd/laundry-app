import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

const DUMMY_CUSTOMERS = [
  { name: 'Ryan Gosling', phone: '081298765432' },
  { name: 'Rahma', phone: '085712345678' },
  { name: 'Buna Tedy', phone: '081399887766' },
  { name: 'Abuy', phone: '089911223344' },
  { name: 'Lala', phone: '087855667788' },
  { name: 'Tok Dalang', phone: '085288776655' },
  { name: 'Nobita', phone: '081122334455' },
  { name: 'SpongeBob', phone: '081244332211' },
  { name: 'Patrick Star', phone: '087799887766' },
  { name: 'Naruto Uzumaki', phone: '081377889900' },
  { name: 'Sherlock Holmes', phone: '085699001122' },
  { name: 'Bruce Wayne', phone: '081200998877' },
  { name: 'Iron Man', phone: '089677889900' },
  { name: 'Peter Parker', phone: '081199887766' },
  { name: 'Wednesday Addams', phone: '087811223344' },
];

async function getOrCreateService(name: string, slug: string, price: number, isExpress: boolean) {
  let service = await prisma.service.findUnique({ where: { slug } });
  if (!service) {
    service = await prisma.service.create({
      data: {
        name,
        slug,
        pricePerKg: price,
        baseDurationMinutes: isExpress ? 15 : 20,
        durationPerKgMinutes: isExpress ? 12 : 20,
        isExpress,
        isActive: true,
        unit: 'KG',
      },
    });
    console.log(`Created service: ${name}`);
  }
  return service;
}

async function getUniqueOrderCode(date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const datePrefix = `LDY-${year}${month}${day}`;

  // Find max suffix for this prefix
  const orders = await prisma.order.findMany({
    where: {
      orderCode: {
        startsWith: datePrefix,
      },
    },
    select: {
      orderCode: true,
    },
  });

  let maxNum = 0;
  orders.forEach((o) => {
    const parts = o.orderCode.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${datePrefix}-${nextNum.toString().padStart(4, '0')}`;
}

async function main() {
  console.log('--- START SEEDING DUMMY DATA ---');

  // 1. Clear existing transactional data to ensure a clean, perfect wave
  console.log('Clearing existing transactional data...');
  await prisma.notification.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Ensure Services Exist
  const regularService = await getOrCreateService('Regular', 'regular', 10000, false);
  const expressService = await getOrCreateService('Express', 'express', 15000, true);

  // 3. Seed Customers
  const seededCustomers = [];
  for (const c of DUMMY_CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name },
      create: { name: c.name, phone: c.phone },
    });
    seededCustomers.push(customer);
  }
  console.log(`Seeded ${seededCustomers.length} customers.`);

  // 4. Define target dates (from 14 days ago up to today)
  const today = new Date('2026-05-23T09:41:31+07:00');
  
  // Helper to subtract days
  const subtractDays = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - days);
    return newDate;
  };

  // Helper to generate a random number within range
  const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomIntRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Order logs holder
  let ordersCount = 0;

  // 5. Seed completed orders (status: PICKED_UP) with a dynamic daily order count (1 to 4) to create a beautiful wave
  for (let i = 14; i >= 1; i--) {
    const orderDateBase = subtractDays(today, i);
    const dailyOrdersCount = randomIntRange(1, 4); // Generates naturally fluctuating daily volume (1 to 4 orders)

    for (let oIdx = 0; oIdx < dailyOrdersCount; oIdx++) {
      const orderDate = new Date(orderDateBase);
      // Set random hour between 08:00 and 17:00
      orderDate.setHours(randomIntRange(8, 17), randomIntRange(0, 59), 0, 0);

      const customer = pickRandom(seededCustomers);
      const service = pickRandom([regularService, expressService]);
      const weight = parseFloat(randomRange(1.5, 7.5).toFixed(1));
      const totalPrice = weight * service.pricePerKg;

      const estDuration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
      const estStart = new Date(orderDate);
      const estEnd = new Date(estStart.getTime() + estDuration * 60 * 1000);

      const orderCode = await getUniqueOrderCode(orderDate);
      const paymentMethod = pickRandom([PaymentMethod.CASH, PaymentMethod.QRIS, PaymentMethod.TRANSFER, PaymentMethod.EWALLET]);

      // Create completed order
      const order = await prisma.order.create({
        data: {
          orderCode,
          customerId: customer.id,
          serviceId: service.id,
          weightKg: weight,
          pricePerKg: service.pricePerKg,
          totalPrice,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod,
          status: OrderStatus.PICKED_UP,
          queueNumber: randomIntRange(1, 10),
          estimatedDurationMinutes: estDuration,
          estimatedStartAt: estStart,
          estimatedEndAt: estEnd,
          actualStartAt: estStart,
          actualEndAt: estEnd,
          readyAt: estEnd,
          pickedUpAt: new Date(estEnd.getTime() + randomIntRange(1, 24) * 60 * 60 * 1000), // picked up between 1h to 24h later
          notes: pickRandom([null, 'Setrika rapi', 'Jangan digantung', 'Pakai pewangi ekstra']),
          machineNumber: randomIntRange(1, 3),
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      });

      // Create payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalPrice,
          method: paymentMethod,
          status: PaymentStatus.PAID,
          paidAt: orderDate,
          createdAt: orderDate,
        },
      });

      // Create timeline logs
      await prisma.orderStatusLog.createMany({
        data: [
          { orderId: order.id, status: OrderStatus.QUEUED, createdAt: orderDate, note: 'Pesanan masuk antrean.' },
          { orderId: order.id, status: OrderStatus.PROCESSING, createdAt: estStart, note: `Mulai dikerjakan pada Mesin #${order.machineNumber}.` },
          { orderId: order.id, status: OrderStatus.READY, createdAt: estEnd, note: 'Pakaian selesai diproses & siap diambil.' },
          { orderId: order.id, status: OrderStatus.PICKED_UP, createdAt: order.pickedUpAt as Date, note: 'Pesanan telah diambil oleh pelanggan.' },
        ],
      });

      ordersCount++;
    }
  }

  // 4. Seed 3 READY orders from yesterday/today
  for (let i = 0; i < 3; i++) {
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - 1);
    orderDate.setHours(randomIntRange(9, 16), randomIntRange(0, 59), 0, 0);

    const customer = pickRandom(seededCustomers);
    const service = pickRandom([regularService, expressService]);
    const weight = parseFloat(randomRange(2.0, 6.0).toFixed(1));
    const totalPrice = weight * service.pricePerKg;

    const estDuration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
    const estStart = new Date(orderDate);
    const estEnd = new Date(estStart.getTime() + estDuration * 60 * 1000);

    const orderCode = await getUniqueOrderCode(orderDate);
    const paymentStatus = pickRandom([PaymentStatus.PAID, PaymentStatus.UNPAID]);
    const paymentMethod = pickRandom([PaymentMethod.CASH, PaymentMethod.QRIS]);

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceId: service.id,
        weightKg: weight,
        pricePerKg: service.pricePerKg,
        totalPrice,
        paymentStatus,
        paymentMethod,
        status: OrderStatus.READY,
        queueNumber: randomIntRange(1, 5),
        estimatedDurationMinutes: estDuration,
        estimatedStartAt: estStart,
        estimatedEndAt: estEnd,
        actualStartAt: estStart,
        actualEndAt: estEnd,
        readyAt: estEnd,
        notes: pickRandom([null, 'Pakaian bayi, cuci lembut']),
        machineNumber: randomIntRange(1, 3),
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    if (paymentStatus === PaymentStatus.PAID) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalPrice,
          method: paymentMethod,
          status: PaymentStatus.PAID,
          paidAt: orderDate,
          createdAt: orderDate,
        },
      });
    }

    await prisma.orderStatusLog.createMany({
      data: [
        { orderId: order.id, status: OrderStatus.QUEUED, createdAt: orderDate, note: 'Pesanan masuk antrean.' },
        { orderId: order.id, status: OrderStatus.PROCESSING, createdAt: estStart, note: `Mulai dikerjakan pada Mesin #${order.machineNumber}.` },
        { orderId: order.id, status: OrderStatus.READY, createdAt: estEnd, note: 'Selesai disetrika wangi, menunggu pengambilan.' },
      ],
    });

    ordersCount++;
  }

  // 5. Seed 2 PROCESSING orders from today
  for (let i = 0; i < 2; i++) {
    const orderDate = new Date(today);
    // created 1-2 hours ago
    orderDate.setHours(today.getHours() - randomIntRange(1, 2), randomIntRange(0, 59), 0, 0);

    const customer = pickRandom(seededCustomers);
    const service = pickRandom([regularService, expressService]);
    const weight = parseFloat(randomRange(2.0, 5.0).toFixed(1));
    const totalPrice = weight * service.pricePerKg;

    const estDuration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
    const estStart = new Date(orderDate);
    const estEnd = new Date(estStart.getTime() + estDuration * 60 * 1000);

    const orderCode = await getUniqueOrderCode(orderDate);
    const paymentMethod = PaymentMethod.QRIS;

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceId: service.id,
        weightKg: weight,
        pricePerKg: service.pricePerKg,
        totalPrice,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod,
        status: OrderStatus.PROCESSING,
        queueNumber: i + 1,
        estimatedDurationMinutes: estDuration,
        estimatedStartAt: estStart,
        estimatedEndAt: estEnd,
        actualStartAt: estStart,
        notes: 'Pewangi Sakura',
        machineNumber: i + 1,
        createdAt: orderDate,
        updatedAt: today,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalPrice,
        method: paymentMethod,
        status: PaymentStatus.PAID,
        paidAt: orderDate,
        createdAt: orderDate,
      },
    });

    await prisma.orderStatusLog.createMany({
      data: [
        { orderId: order.id, status: OrderStatus.QUEUED, createdAt: orderDate, note: 'Pesanan didaftarkan.' },
        { orderId: order.id, status: OrderStatus.PROCESSING, createdAt: estStart, note: `Mulai dicuci pada Mesin #${order.machineNumber}.` },
      ],
    });

    ordersCount++;
  }

  // 6. Seed 2 QUEUED orders from today
  for (let i = 0; i < 2; i++) {
    const orderDate = new Date(today);
    // created 10-30 minutes ago
    orderDate.setMinutes(today.getMinutes() - randomIntRange(10, 30));

    const customer = pickRandom(seededCustomers);
    const service = pickRandom([regularService, expressService]);
    const weight = parseFloat(randomRange(1.5, 4.0).toFixed(1));
    const totalPrice = weight * service.pricePerKg;

    const estDuration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
    
    // Starts when previous estimate ends
    const estStart = new Date(today);
    estStart.setHours(today.getHours() + 1);
    const estEnd = new Date(estStart.getTime() + estDuration * 60 * 1000);

    const orderCode = await getUniqueOrderCode(orderDate);

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceId: service.id,
        weightKg: weight,
        pricePerKg: service.pricePerKg,
        totalPrice,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.CASH,
        status: OrderStatus.QUEUED,
        queueNumber: i + 3,
        estimatedDurationMinutes: estDuration,
        estimatedStartAt: estStart,
        estimatedEndAt: estEnd,
        notes: 'Pisahkan pakaian putih',
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: OrderStatus.QUEUED,
        createdAt: orderDate,
        note: 'Menunggu mesin cuci kosong.',
      },
    });

    ordersCount++;
  }

  // 7. Seed 1 CANCELLED order from 3 days ago
  {
    const orderDate = subtractDays(today, 3);
    orderDate.setHours(11, 20, 0, 0);

    const customer = pickRandom(seededCustomers);
    const service = regularService;
    const weight = 3.5;
    const totalPrice = weight * service.pricePerKg;

    const estDuration = service.baseDurationMinutes + Math.round(weight * service.durationPerKgMinutes);
    const estStart = new Date(orderDate);
    const estEnd = new Date(estStart.getTime() + estDuration * 60 * 1000);

    const orderCode = await getUniqueOrderCode(orderDate);

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        serviceId: service.id,
        weightKg: weight,
        pricePerKg: service.pricePerKg,
        totalPrice,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.CASH,
        status: OrderStatus.CANCELLED,
        queueNumber: 9,
        estimatedDurationMinutes: estDuration,
        estimatedStartAt: estStart,
        estimatedEndAt: estEnd,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    await prisma.orderStatusLog.createMany({
      data: [
        { orderId: order.id, status: OrderStatus.QUEUED, createdAt: orderDate, note: 'Order created' },
        { orderId: order.id, status: OrderStatus.CANCELLED, createdAt: new Date(orderDate.getTime() + 15 * 60 * 1000), note: 'Pembatalan pesanan atas permintaan pelanggan.' },
      ],
    });

    ordersCount++;
  }

  console.log(`Successfully seeded ${ordersCount} dummy orders in total!`);
  console.log('--- SEEDING DUMMY DATA COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
