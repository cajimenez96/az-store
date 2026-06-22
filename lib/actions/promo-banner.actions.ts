'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertPromoBannerSchema, updatePromoBannerSchema } from '../validators';
import { deleteUTFiles } from '../uploadthing-helpers';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAllPromoBanners() {
  return prisma.promoBanner.findMany({
    orderBy: { createdAt: 'desc' },
    include: { products: { select: { id: true, name: true } } },
  });
}

export async function getPromoBannerById(id: string) {
  return prisma.promoBanner.findFirst({
    where: { id },
    include: { products: { select: { id: true, name: true, images: true } } },
  });
}

export async function getActivePromoBanners() {
  const now = new Date();
  return prisma.promoBanner.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: 'desc' },
    include: { products: { select: { id: true } } },
  });
}

export async function getPromoBannerWithProducts(id: string) {
  const now = new Date();
  return prisma.promoBanner.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: { products: { select: { id: true } } },
  });
}

export async function getPromoBannerWithProductsPublic(id: string) {
  const now = new Date();
  return prisma.promoBanner.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    select: {
      title: true,
      discountPercent: true,
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          prices: { where: { paymentMethod: 'CASH' }, select: { value: true } },
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });
}

export async function createPromoBanner(data: z.infer<typeof insertPromoBannerSchema>) {
  try {
    await requireAdmin();
    const parsed = insertPromoBannerSchema.parse(data);
    const { productIds, ...rest } = parsed;

    await prisma.promoBanner.create({
      data: {
        image: rest.image,
        title: rest.title,
        subtitle: rest.subtitle,
        linkLabel: rest.linkLabel,
        discountPercent: rest.discountPercent ?? null,
        order: rest.order,
        isActive: rest.isActive,
        startsAt: rest.startsAt ? new Date(rest.startsAt) : null,
        endsAt: rest.endsAt ? new Date(rest.endsAt) : null,
        products: {
          connect: productIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath('/admin/promotions/banners');
    revalidatePath('/');

    return { success: true, message: 'Banner creado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updatePromoBanner(data: z.infer<typeof updatePromoBannerSchema>) {
  try {
    await requireAdmin();
    const parsed = updatePromoBannerSchema.parse(data);
    const { id, productIds, ...rest } = parsed;

    const exists = await prisma.promoBanner.findFirst({ where: { id } });
    if (!exists) throw new Error('Banner no encontrado');

    await prisma.promoBanner.update({
      where: { id },
      data: {
        image: rest.image,
        title: rest.title,
        subtitle: rest.subtitle,
        linkLabel: rest.linkLabel,
        discountPercent: rest.discountPercent ?? null,
        order: rest.order,
        isActive: rest.isActive,
        startsAt: rest.startsAt ? new Date(rest.startsAt) : null,
        endsAt: rest.endsAt ? new Date(rest.endsAt) : null,
        products: {
          set: productIds.map((pid) => ({ id: pid })),
        },
      },
    });

    // Si el admin reemplazó la imagen, liberamos el asset anterior.
    if (exists.image && exists.image !== rest.image) {
      await deleteUTFiles([exists.image]);
    }

    revalidatePath('/admin/promotions/banners');
    revalidatePath('/');

    return { success: true, message: 'Banner actualizado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deletePromoBanner(id: string) {
  try {
    await requireAdmin();

    const exists = await prisma.promoBanner.findFirst({ where: { id } });
    if (!exists) throw new Error('Banner no encontrado');

    await prisma.promoBanner.delete({ where: { id } });

    // Liberar el asset de UploadThing después de commit.
    if (exists.image) {
      await deleteUTFiles([exists.image]);
    }

    revalidatePath('/admin/promotions/banners');
    revalidatePath('/');

    return { success: true, message: 'Banner eliminado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
