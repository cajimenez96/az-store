import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

type OnlinePaymentMethod = 'MercadoPago' | 'TransferenciaBancaria';

const PAYMENT_METHOD_LABELS: Record<OnlinePaymentMethod, string> = {
  MercadoPago: 'Mercado Pago',
  TransferenciaBancaria: 'Transferencia Bancaria',
};

function resolveDiscountPercent(
  promoCode: {
    discountPercentMercadoPago: { toNumber(): number } | number | null;
    discountPercentTransferencia: { toNumber(): number } | number | null;
  },
  paymentMethod: string
): { percent: number | null; appliedMethod: OnlinePaymentMethod | null } {
  const toNumber = (
    v: { toNumber(): number } | number | null | undefined
  ): number | null => {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    return v.toNumber();
  };
  if (paymentMethod === 'TransferenciaBancaria') {
    return {
      percent: toNumber(promoCode.discountPercentTransferencia),
      appliedMethod: 'TransferenciaBancaria',
    };
  }

  // Default to MercadoPago for any non-Transferencia method (POS won't get here
  // because we reject POS upstream).
  return {
    percent: toNumber(promoCode.discountPercentMercadoPago),
    appliedMethod: 'MercadoPago',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();
    const queryPaymentMethod = searchParams.get('paymentMethod');

    if (!code) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Código no proporcionado',
          discountPercent: 0,
        },
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

    // Resolve the user's payment method. Prefer the query string (lets the
    // client re-validate after switching the method) and fall back to the
    // session's stored value.
    let paymentMethod: string | null = queryPaymentMethod ?? null;

    if (!paymentMethod) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { paymentMethod: true },
      });
      paymentMethod = dbUser?.paymentMethod ?? null;
    }

    if (paymentMethod && paymentMethod.startsWith('PuntoDeVenta')) {
      return NextResponse.json({
        valid: false,
        message: 'Los cupones no aplican a pagos en punto de venta',
        discountPercent: 0,
      });
    }

    if (!paymentMethod) {
      return NextResponse.json({
        valid: false,
        message: 'Seleccioná un método de pago antes de aplicar un cupón',
        discountPercent: 0,
      });
    }

    const { percent, appliedMethod } = resolveDiscountPercent(
      promoCode,
      paymentMethod
    );

    if (!percent || percent <= 0 || !appliedMethod) {
      const label =
        PAYMENT_METHOD_LABELS[paymentMethod as OnlinePaymentMethod] ??
        paymentMethod;
      return NextResponse.json({
        valid: false,
        message: `Este cupón no aplica para ${label}. Cambiá el método de pago para usarlo.`,
        discountPercent: 0,
      });
    }

    return NextResponse.json({
      valid: true,
      message: `¡Código válido! ${percent}% de descuento con ${PAYMENT_METHOD_LABELS[appliedMethod]}`,
      discountPercent: percent,
      promoCodeId: promoCode.id,
      appliedPaymentMethod: appliedMethod,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { valid: false, message: 'Error al validar código', discountPercent: 0 },
      { status: 500 }
    );
  }
}
