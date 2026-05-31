'use server';

import { prisma } from '@/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { formatError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

interface PromoCodeInput {
  code: string;
  description?: string;
  discountPercent: number;
  isActive: boolean;
  maxUsesPerUser?: number | null;
  startsAt?: Date;
  endsAt?: Date;
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

    return promoCodes.map((code) => ({
      id: code.id,
      code: code.code,
      description: code.description,
      discountPercent: Number(code.discountPercent),
      isActive: code.isActive,
      maxUsesPerUser: code.maxUsesPerUser,
      startsAt: code.startsAt?.toISOString() ?? null,
      endsAt: code.endsAt?.toISOString() ?? null,
      createdAt: code.createdAt?.toISOString() ?? null,
      updatedAt: code.updatedAt?.toISOString() ?? null,
      usageHistory: code.usageHistory,
    }));
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

    return {
      id: promoCode.id,
      code: promoCode.code,
      description: promoCode.description,
      discountPercent: Number(promoCode.discountPercent),
      isActive: promoCode.isActive,
      maxUsesPerUser: promoCode.maxUsesPerUser,
      startsAt: promoCode.startsAt?.toISOString() ?? null,
      endsAt: promoCode.endsAt?.toISOString() ?? null,
      createdAt: promoCode.createdAt?.toISOString() ?? null,
      updatedAt: promoCode.updatedAt?.toISOString() ?? null,
    };
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

    if (data.discountPercent <= 0 || data.discountPercent > 100) {
      throw new Error('El descuento debe ser entre 0 y 100');
    }

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
        discountPercent: new Decimal(data.discountPercent),
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
      data: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountPercent: Number(promoCode.discountPercent),
        isActive: promoCode.isActive,
        maxUsesPerUser: promoCode.maxUsesPerUser,
        startsAt: promoCode.startsAt?.toISOString() ?? null,
        endsAt: promoCode.endsAt?.toISOString() ?? null,
        createdAt: promoCode.createdAt?.toISOString() ?? null,
        updatedAt: promoCode.updatedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updatePromoCode(id: string, data: Partial<PromoCodeInput>) {
  try {
    await requireAdmin();

    if (data.discountPercent !== undefined) {
      if (data.discountPercent <= 0 || data.discountPercent > 100) {
        throw new Error('El descuento debe ser entre 0 y 100');
      }
    }

    const updateData: any = {
      description: data.description,
      isActive: data.isActive,
      maxUsesPerUser: data.maxUsesPerUser,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };

    if (data.discountPercent !== undefined) {
      updateData.discountPercent = new Decimal(data.discountPercent);
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/promotions/discount-codes');
    return {
      success: true,
      message: 'Código promocional actualizado exitosamente',
      data: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountPercent: Number(promoCode.discountPercent),
        isActive: promoCode.isActive,
        maxUsesPerUser: promoCode.maxUsesPerUser,
        startsAt: promoCode.startsAt?.toISOString() ?? null,
        endsAt: promoCode.endsAt?.toISOString() ?? null,
        createdAt: promoCode.createdAt?.toISOString() ?? null,
        updatedAt: promoCode.updatedAt?.toISOString() ?? null,
      },
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

export async function validatePromoCode(
  code: string,
  userId: string
): Promise<{
  valid: boolean;
  promoCodeId?: string;
  discountPercent?: number;
  message: string;
}> {
  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return {
        valid: false,
        message: 'Código de promoción no válido',
      };
    }

    if (!promoCode.isActive) {
      return {
        valid: false,
        message: 'Este código de promoción no está activo',
      };
    }

    const now = new Date();
    if (promoCode.startsAt && now < promoCode.startsAt) {
      return {
        valid: false,
        message: 'Este código aún no es válido',
      };
    }

    if (promoCode.endsAt && now > promoCode.endsAt) {
      return {
        valid: false,
        message: 'Este código ha expirado',
      };
    }

    if (promoCode.maxUsesPerUser) {
      const usageCount = await prisma.promoCodeUsage.count({
        where: {
          promoCodeId: promoCode.id,
          userId,
        },
      });

      if (usageCount >= promoCode.maxUsesPerUser) {
        return {
          valid: false,
          message: `Ya has usado este código el máximo de veces permitidas (${promoCode.maxUsesPerUser})`,
        };
      }
    }

    return {
      valid: true,
      promoCodeId: promoCode.id,
      discountPercent: Number(promoCode.discountPercent),
      message: `¡Código válido! ${promoCode.discountPercent}% de descuento`,
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      valid: false,
      message: 'Error al validar el código',
    };
  }
}
