'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertPromotionSchema, updatePromotionSchema } from '../validators';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAllPromotions() {
  const data = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return data;
}

export async function getPromotionById(id: string) {
  const data = await prisma.promotion.findFirst({
    where: { id },
  });
  return data;
}

export async function getActivePromotion() {
  const now = new Date();
  const promotion = await prisma.promotion.findFirst({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: 'desc' },
  });
  return promotion;
}

export async function createPromotion(data: z.infer<typeof insertPromotionSchema>) {
  try {
    await requireAdmin();
    const promotionData = insertPromotionSchema.parse(data);

    const startDate = promotionData.startsAt ? new Date(promotionData.startsAt) : null;
    const endDate = promotionData.endsAt ? new Date(promotionData.endsAt) : null;

    await prisma.promotion.create({
      data: {
        title: promotionData.title,
        subtitle: promotionData.subtitle,
        linkUrl: promotionData.linkUrl || null,
        linkLabel: promotionData.linkLabel,
        bgColor: promotionData.bgColor,
        textColor: promotionData.textColor,
        isActive: promotionData.isActive,
        startsAt: startDate,
        endsAt: endDate,
      },
    });

    revalidatePath('/admin/promotions');

    return {
      success: true,
      message: 'Promoción creada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updatePromotion(data: z.infer<typeof updatePromotionSchema>) {
  try {
    await requireAdmin();
    const promotionData = updatePromotionSchema.parse(data);

    const promotionExists = await prisma.promotion.findFirst({
      where: { id: promotionData.id },
    });

    if (!promotionExists) throw new Error('Promoción no encontrada');

    const startDate = promotionData.startsAt ? new Date(promotionData.startsAt) : null;
    const endDate = promotionData.endsAt ? new Date(promotionData.endsAt) : null;

    await prisma.promotion.update({
      where: { id: promotionData.id },
      data: {
        title: promotionData.title,
        subtitle: promotionData.subtitle,
        linkUrl: promotionData.linkUrl || null,
        linkLabel: promotionData.linkLabel,
        bgColor: promotionData.bgColor,
        textColor: promotionData.textColor,
        isActive: promotionData.isActive,
        startsAt: startDate,
        endsAt: endDate,
      },
    });

    revalidatePath('/admin/promotions');

    return {
      success: true,
      message: 'Promoción actualizada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deletePromotion(id: string) {
  try {
    await requireAdmin();

    const promotionExists = await prisma.promotion.findFirst({ where: { id } });
    if (!promotionExists) throw new Error('Promoción no encontrada');

    await prisma.promotion.delete({ where: { id } });

    revalidatePath('/admin/promotions');
    return { success: true, message: 'Promoción eliminada exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
