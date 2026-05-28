import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

/**
 * Cart recovery endpoint
 * Validates recovery token and returns cart details for pre-loading
 * Usage: /api/cart-recovery?token=XXX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    // Find cart recovery record
    const recovery = await prisma.cartRecovery.findUnique({
      where: { token },
    });

    if (!recovery) {
      return NextResponse.json(
        { success: false, message: 'Token inválido o expirado' },
        { status: 404 }
      );
    }

    // Check if already recovered
    if (recovery.recoveredAt) {
      return NextResponse.json(
        { success: false, message: 'Este carrito ya fue recuperado' },
        { status: 400 }
      );
    }

    // Check if token is older than 7 days (recovery window)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (recovery.sentAt < sevenDaysAgo) {
      return NextResponse.json(
        { success: false, message: 'El link de recuperación ha expirado (7 días)' },
        { status: 400 }
      );
    }

    // Get cart details
    const cart = await prisma.cart.findUnique({
      where: { id: recovery.cartId },
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

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Carrito no encontrado' },
        { status: 404 }
      );
    }

    // Return cart data for pre-loading
    // Frontend will use this to restore cart and redirect to checkout
    return NextResponse.json({
      success: true,
      message: 'Carrito recuperado exitosamente',
      data: {
        cartId: cart.id,
        items: cart.items,
        itemsPrice: cart.itemsPrice.toString(),
        shippingPrice: cart.shippingPrice.toString(),
        taxPrice: cart.taxPrice.toString(),
        totalPrice: cart.totalPrice.toString(),
        userEmail: cart.user?.email,
        recoveryToken: token,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error in cart recovery:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Mark cart as recovered
 * Usage: POST /api/cart-recovery with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    // Update recovery record with recovered timestamp
    const updated = await prisma.cartRecovery.update({
      where: { token },
      data: {
        recoveredAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Carrito marcado como recuperado',
      data: { recoveredAt: updated.recoveredAt },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error marking cart as recovered:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
