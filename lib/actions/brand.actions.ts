'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertBrandSchema, updateBrandSchema } from '../validators';
import { z } from 'zod';
import { requireAdminOrSeller } from '@/lib/auth-guard';

// Get all brands
export async function getAllBrands() {
  const data = await prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
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

// Delete a brand
export async function deleteBrand(id: string) {
  try {
    await requireAdminOrSeller();
    const brandExists = await prisma.brand.findFirst({
      where: { id },
    });

    if (!brandExists) throw new Error('Marca no encontrada');

    await prisma.brand.delete({ where: { id } });

    revalidatePath('/admin/brands');

    return {
      success: true,
      message: 'Marca eliminada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
