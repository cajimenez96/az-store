import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { randomBytes } from 'crypto';

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

    // Calculate 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find abandoned carts: updatedAt > 1 hour, user exists
    // Note: Will filter by items.length > 0 and email exists in JavaScript after fetching
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          lt: oneHourAgo,
        },
        userId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Filter carts with items and valid email
    const cartsWithItems = abandonedCarts.filter(
      (cart) =>
        Array.isArray(cart.items) &&
        cart.items.length > 0 &&
        cart.user?.email
    );

    if (cartsWithItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay carritos abandonados para procesar',
        processedCount: 0,
      });
    }

    let processedCount = 0;
    const recoveryTokens: Array<{ cartId: string; email: string; token: string }> = [];

    // Process each abandoned cart
    for (const cart of cartsWithItems) {
      if (!cart.user?.email) continue;

      // Check if cart recovery already exists for this cart
      const existingRecovery = await prisma.cartRecovery.findFirst({
        where: {
          cartId: cart.id,
          recoveredAt: null, // Only check non-recovered attempts
        },
      });

      // Skip if recovery already sent (to avoid duplicate emails)
      if (existingRecovery) continue;

      // Generate recovery token
      const token = randomBytes(32).toString('hex');

      // Create cart recovery record
      await prisma.cartRecovery.create({
        data: {
          cartId: cart.id,
          email: cart.user.email,
          token,
        },
      });

      recoveryTokens.push({
        cartId: cart.id,
        email: cart.user.email,
        token,
      });

      processedCount++;
    }

    // TODO: Send recovery emails in batch (integrate with lib/email.ts when ready)
    // For now, recovery tokens are stored in CartRecovery table

    return NextResponse.json({
      success: true,
      message: `Procesados ${processedCount} carritos abandonados`,
      processedCount,
      recoveryTokensGenerated: recoveryTokens.length,
      cartIds: cartsWithItems.map((c) => c.id),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error running detect-abandoned-carts cron:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
