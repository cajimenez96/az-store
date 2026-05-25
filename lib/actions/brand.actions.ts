'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertBrandSchema, updateBrandSchema } from '../validators';
import { z } from 'zod';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { DEFAULT_BRAND_ID } from '../constants';

// Get all brands
export async function getAllBrands() {
  const data = await prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { products: true } } },
  });
  return data;
}

// Get single brand by ID
export async function getBrandById(brandId: string) {
  const data = await prisma.brand.findFirst({
    where: { id: brandId },
  });
  return data;
}

// Create a brand
export async function createBrand(data: z.infer<typeof insertBrandSchema>) {
  try {
    await requireAdminOrSeller();
    const brandData = insertBrandSchema.parse(data);

    // Check if brand already exists by slug
    const existingBrand = await prisma.brand.findFirst({
      where: { slug: brandData.slug },
    });

    if (existingBrand) {
      throw new Error('Una marca con este slug ya existe');
    }

    await prisma.brand.create({
      data: brandData,
    });

    revalidatePath('/admin/brands');

    return {
      success: true,
      message: 'Marca creada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a brand
export async function updateBrand(data: z.infer<typeof updateBrandSchema>) {
  try {
    await requireAdminOrSeller();
    const brandData = updateBrandSchema.parse(data);

    const brandExists = await prisma.brand.findFirst({
      where: { id: brandData.id },
    });

    if (!brandExists) throw new Error('Marca no encontrada');

    // Check if new slug already exists in another brand
    const slugExists = await prisma.brand.findFirst({
      where: { slug: brandData.slug, id: { not: brandData.id } },
    });

    if (slugExists) {
      throw new Error('Una marca con este slug ya existe');
    }

    await prisma.brand.update({
      where: { id: brandData.id },
      data: {
        name: brandData.name,
        slug: brandData.slug,
      },
    });

    revalidatePath('/admin/brands');

    return {
      success: true,
      message: 'Marca actualizada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Delete a brand (reassigns products to default sentinel before deleting)
export async function deleteBrand(id: string) {
  try {
    await requireAdminOrSeller();

    if (id === DEFAULT_BRAND_ID) {
      return { success: false, message: 'No se puede eliminar la marca predeterminada del sistema' };
    }

    const brandExists = await prisma.brand.findFirst({ where: { id } });
    if (!brandExists) throw new Error('Marca no encontrada');

    await prisma.$transaction(async (tx) => {
      await tx.brand.upsert({
        where: { id: DEFAULT_BRAND_ID },
        create: { id: DEFAULT_BRAND_ID, name: 'Sin marca', slug: 'sin-marca' },
        update: {},
      });

      await tx.product.updateMany({
        where: { brandId: id },
        data: { brandId: DEFAULT_BRAND_ID },
      });

      await tx.brand.delete({ where: { id } });
    });

    revalidatePath('/admin/brands');
    return { success: true, message: 'Marca eliminada exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
