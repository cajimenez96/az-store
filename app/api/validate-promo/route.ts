import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Código no proporcionado', discountPercent: 0 },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, message: 'Debes estar logueado', discountPercent: 0 },
        { status: 401 }
      );
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      return NextResponse.json({
        valid: false,
        message: 'Código de promoción no válido',
        discountPercent: 0,
      });
    }

    if (!promoCode.isActive) {
      return NextResponse.json({
        valid: false,
        message: 'El código de promoción no está activo',
        discountPercent: 0,
      });
    }

    // Check dates
    const now = new Date();
    if (promoCode.startsAt && promoCode.startsAt > now) {
      return NextResponse.json({
        valid: false,
        message: 'Este código aún no es válido',
        discountPercent: 0,
      });
    }
    if (promoCode.endsAt && promoCode.endsAt < now) {
      return NextResponse.json({
        valid: false,
        message: 'Este código ha expirado',
        discountPercent: 0,
      });
    }

    // Check usage limit
    if (promoCode.maxUsesPerUser) {
      const usageCount = await prisma.promoCodeUsage.count({
        where: {
          promoCodeId: promoCode.id,
          userId: session.user.id,
        },
      });

      if (usageCount >= promoCode.maxUsesPerUser) {
        return NextResponse.json({
          valid: false,
          message: `Ya has usado este código el máximo de veces permitidas (${promoCode.maxUsesPerUser})`,
          discountPercent: 0,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      message: `¡Código válido! ${promoCode.discountPercent}% de descuento`,
      discountPercent: Number(promoCode.discountPercent),
      promoCodeId: promoCode.id,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { valid: false, message: 'Error al validar código', discountPercent: 0 },
      { status: 500 }
    );
  }
}
