import { prisma } from './prisma';

export async function generateOrderCodeAndQueue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const date = today.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${date}`;

  // Find the latest order code for today to increment the suffix safely
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderCode: {
        startsWith: `LDY-${dateStr}-`,
      },
    },
    orderBy: {
      orderCode: 'desc',
    },
  });

  let nextNum = 1;
  if (latestOrder) {
    const parts = latestOrder.orderCode.split('-');
    const suffixStr = parts[parts.length - 1];
    const suffixNum = parseInt(suffixStr, 10);
    if (!isNaN(suffixNum)) {
      nextNum = suffixNum + 1;
    }
  }

  const orderCode = `LDY-${dateStr}-${nextNum.toString().padStart(4, '0')}`;
  const queueNumber = nextNum;

  return {
    orderCode,
    queueNumber,
  };
}
