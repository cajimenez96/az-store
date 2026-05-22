import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    
    const authHeader = request.headers.get('Authorization');
    const secretHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const expectedSecret = process.env.CRON_SECRET;
    
    // Auth guard using CRON_SECRET if it is configured
    if (expectedSecret && secretParam !== expectedSecret && secretHeader !== expectedSecret) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();

    // Find unpaid bank transfer orders that have passed their expiration date
    const expiredOrdersRaw = await prisma.order.findMany({
      where: {
        paymentMethod: 'TransferenciaBancaria',
        isPaid: false,
        expiresAt: {
          lt: now,
        },
      },
      include: {
        orderitems: true,
      },
    });

    // Filter in JS to find orders that aren't already marked as CANCELLED in paymentResult
    const expiredOrders = expiredOrdersRaw.filter((order) => {
      const paymentResult = order.paymentResult as { status?: string } | null;
      return !paymentResult || paymentResult.status !== 'CANCELLED';
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay órdenes expiradas para procesar' });
    }

    let processedCount = 0;

    // Process each expired order and restore stock in a transaction
    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Restore product stock
        for (const item of order.orderitems) {
          if (item.size) {
            const variant = await tx.productVariant.findFirst({
              where: { productId: item.productId, size: { name: item.size } }
            });
            if (variant) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: { increment: item.qty } },
              });
            }
          }
        }

        // Cancel order in database (marking status in paymentResult)
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentResult: {
              status: 'CANCELLED',
              reason: 'Expiración automática por falta de comprobante de transferencia (24hs)',
              cancelledAt: new Date().toISOString(),
            },
          },
        });
      });
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Procesadas ${processedCount} órdenes expiradas`,
      cancelledOrderIds: expiredOrders.map(o => o.id),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error running release-expired-orders cron:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
