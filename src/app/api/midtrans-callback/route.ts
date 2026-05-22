import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    if (serverKey) {
      // Verify signature key to prevent spoofing
      const rawString = order_id + status_code + gross_amount + serverKey;
      const calculatedSignature = crypto.createHash('sha512').update(rawString).digest('hex');

      if (calculatedSignature !== signature_key) {
        console.warn('Midtrans Signature Mismatch. Expected:', calculatedSignature, 'Received:', signature_key);
        return NextResponse.json({ error: 'Invalid signature key' }, { status: 400 });
      }
    } else {
      console.warn('Midtrans Server Key is not set in environment. Skipping signature verification (dangerous for production).');
    }

    // Find the order
    let order = await prisma.order.findUnique({
      where: { orderCode: order_id },
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { id: order_id },
      });
    }

    if (!order) {
      console.error('Order not found in callback for ID:', order_id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Map payment type to schema PaymentMethod
    let method: PaymentMethod = PaymentMethod.QRIS;
    if (payment_type === 'qris') {
      method = PaymentMethod.QRIS;
    } else if (payment_type === 'bank_transfer') {
      method = PaymentMethod.TRANSFER;
    } else if (payment_type === 'gopay' || payment_type === 'shopeepay') {
      method = PaymentMethod.EWALLET;
    }

    const now = new Date();

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Payment Successful
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: method,
        },
      });

      // Update payment model
      const payment = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            method,
            paidAt: now,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalPrice,
            status: PaymentStatus.PAID,
            method,
            paidAt: now,
          },
        });
      }

      // Add status log
      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Pembayaran sukses via Midtrans (${payment_type}).`,
        },
      });

      console.log(`Payment confirmed for Order: ${order.orderCode}`);
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      // Payment Failed/Expired
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.UNPAID,
        },
      });

      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: PaymentStatus.UNPAID,
        },
      });

      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Pembayaran gagal/kadaluwarsa via Midtrans (${payment_type}). Status: ${transaction_status}`,
        },
      });

      console.log(`Payment failed for Order: ${order.orderCode}. Status: ${transaction_status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Midtrans callback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
