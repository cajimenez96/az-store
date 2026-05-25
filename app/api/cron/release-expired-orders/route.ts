import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { success: false, message: 'CRON_SECRET no está configurado en el entorno' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('Authorization');
    const secretHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (secretParam !== expectedSecret && secretHeader !== expectedSecret) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();

    // Find all unpaid orders that have passed their expiration date
    const expiredOrdersRaw = await prisma.order.findMany({
      where: {
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

    // Process each expired order
    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Only bank transfer orders reserved stock — restore it on expiry
        if (order.paymentMethod === 'TransferenciaBancaria') {
          for (const item of order.orderitems) {
            if (item.size) {
              const variant = await tx.productVariant.findFirst({
                where: { productId: item.productId, size: { name: item.size } },
              });
              if (variant) {
                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: { stock: { increment: item.qty } },
                });
              }
            }
          }
        }

        const reason =
          order.paymentMethod === 'TransferenciaBancaria'
            ? 'Expiración automática por falta de comprobante de transferencia (24hs)'
            : 'Expiración automática por pago no completado';

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentResult: {
              status: 'CANCELLED',
              reason,
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
