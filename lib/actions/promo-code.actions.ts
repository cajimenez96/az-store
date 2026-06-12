'use server';

import { prisma } from '@/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { formatError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import type { PromoCode, PromoCodeUsage } from '@prisma/client';

interface PromoCodeInput {
  code: string;
  description?: string;
  discountPercentMercadoPago?: number | null;
  discountPercentTransferencia?: number | null;
  isActive: boolean;
  maxUsesPerUser?: number | null;
  startsAt?: Date;
  endsAt?: Date;
}

interface PromoCodeOutput {
  id: string;
  code: string;
  description: string | null;
  discountPercentMercadoPago: number | null;
  discountPercentTransferencia: number | null;
  isActive: boolean;
  maxUsesPerUser: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  usageHistory?: { id: string; userId: string; usedAt: Date }[];
}

const MAX_DISCOUNT_PERCENT = 100;

function validateDiscountFields(input: {
  discountPercentMercadoPago?: number | null;
  discountPercentTransferencia?: number | null;
}): void {
  const mp = input.discountPercentMercadoPago;
  const tr = input.discountPercentTransferencia;

  const isPositive = (v: number | null | undefined) =>
    typeof v === 'number' && !Number.isNaN(v) && v > 0;
  const isValidRange = (v: number | null | undefined) =>
    v == null || (typeof v === 'number' && v > 0 && v <= MAX_DISCOUNT_PERCENT);

  if (!isPositive(mp) && !isPositive(tr)) {
    throw new Error(
      'Debes definir al menos un descuento para algún método de pago'
    );
  }

  if (!isValidRange(mp) || !isValidRange(tr)) {
    throw new Error('El descuento debe ser entre 0 y 100');
  }
}

type PromoCodeWithUsage = PromoCode & {
  usageHistory?: Pick<PromoCodeUsage, 'id' | 'userId' | 'usedAt'>[];
};

function toOutput(code: PromoCodeWithUsage): PromoCodeOutput {
  return {
    id: code.id,
    code: code.code,
    description: code.description,
    discountPercentMercadoPago:
      code.discountPercentMercadoPago == null
        ? null
        : Number(code.discountPercentMercadoPago),
    discountPercentTransferencia:
      code.discountPercentTransferencia == null
        ? null
        : Number(code.discountPercentTransferencia),
    isActive: code.isActive,
    maxUsesPerUser: code.maxUsesPerUser,
    startsAt: code.startsAt?.toISOString() ?? null,
    endsAt: code.endsAt?.toISOString() ?? null,
    createdAt: code.createdAt?.toISOString() ?? null,
    updatedAt: code.updatedAt?.toISOString() ?? null,
    usageHistory: code.usageHistory,
  };
}

export async function getPromoCodes() {
  try {
    await requireAdmin();

    const promoCodes = await prisma.promoCode.findMany({
      include: {
        usageHistory: {
          select: { id: true, userId: true, usedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promoCodes.map(toOutput);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

export async function getPromoCodeById(id: string) {
  try {
    await requireAdmin();

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) return null;

    return toOutput(promoCode);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

export async function createPromoCode(data: PromoCodeInput) {
  try {
    await requireAdmin();

    if (!data.code || data.code.length < 3) {
      throw new Error('El código debe tener al menos 3 caracteres');
    }

    validateDiscountFields(data);

    const existingCode = await prisma.promoCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new Error('Este código de promoción ya existe');
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountPercentMercadoPago:
          data.discountPercentMercadoPago == null
            ? null
            : new Decimal(data.discountPercentMercadoPago),
        discountPercentTransferencia:
          data.discountPercentTransferencia == null
            ? null
            : new Decimal(data.discountPercentTransferencia),
        isActive: data.isActive,
        maxUsesPerUser: data.maxUsesPerUser,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    revalidatePath('/admin/promotions/discount-codes');
    return {
      success: true,
      message: 'Código promocional creado exitosamente',
      data: toOutput(promoCode),
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updatePromoCode(
  id: string,
  data: Partial<PromoCodeInput>
) {
  try {
    await requireAdmin();

    // When the caller is touching discount fields, validate the final shape of
    // the persisted row. We re-read the existing row to merge partial updates
    // before applying the at-least-one-positive rule.
    if (
      data.discountPercentMercadoPago !== undefined ||
      data.discountPercentTransferencia !== undefined
    ) {
      const existing = await prisma.promoCode.findUnique({ where: { id } });
      if (!existing) throw new Error('Código promocional no encontrado');

      validateDiscountFields({
        discountPercentMercadoPago:
          data.discountPercentMercadoPago === undefined
            ? existing.discountPercentMercadoPago == null
              ? null
              : Number(existing.discountPercentMercadoPago)
            : data.discountPercentMercadoPago,
        discountPercentTransferencia:
          data.discountPercentTransferencia === undefined
            ? existing.discountPercentTransferencia == null
              ? null
              : Number(existing.discountPercentTransferencia)
            : data.discountPercentTransferencia,
      });
    }

    const updateData: {
      description?: string;
      isActive?: boolean;
      maxUsesPerUser?: number | null;
      startsAt?: Date;
      endsAt?: Date;
      discountPercentMercadoPago?: Decimal | null;
      discountPercentTransferencia?: Decimal | null;
    } = {
      description: data.description,
      isActive: data.isActive,
      maxUsesPerUser: data.maxUsesPerUser,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };

    if (data.discountPercentMercadoPago !== undefined) {
      updateData.discountPercentMercadoPago =
        data.discountPercentMercadoPago == null
          ? null
          : new Decimal(data.discountPercentMercadoPago);
    }
    if (data.discountPercentTransferencia !== undefined) {
      updateData.discountPercentTransferencia =
        data.discountPercentTransferencia == null
          ? null
          : new Decimal(data.discountPercentTransferencia);
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/promotions/discount-codes');
    return {
      success: true,
      message: 'Código promocional actualizado exitosamente',
      data: toOutput(promoCode),
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await requireAdmin();

    await prisma.promoCode.delete({
      where: { id },
    });

    revalidatePath('/admin/promotions/discount-codes');
    return {
      success: true,
      message: 'Código promocional eliminado exitosamente',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function recordPromoCodeUsage(
  promoCodeId: string,
  userId: string,
  orderId: string
) {
  try {
    await prisma.promoCodeUsage.create({
      data: {
        promoCodeId,
        userId,
        orderId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording promo code usage:', error);
    return { success: false };
  }
}
