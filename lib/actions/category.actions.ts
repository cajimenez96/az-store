'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath, unstable_cache } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { DEFAULT_CATEGORY_ID } from '../constants';

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const getAllCategories = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          sizes: true,
          subCategories: { orderBy: { name: 'asc' } },
          _count: { select: { products: true } },
        },
      });
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },
  ['all-categories'],
  { revalidate: 3600, tags: ['categories'] }
);

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { sizes: true, subCategories: { orderBy: { name: 'asc' } } },
    });
    return { success: true, data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createCategory(data: { name: string; slug: string }) {
  try {
    await requireAdmin();
    const category = await prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({ data });
      await tx.size.create({
        data: { name: 'Único', categoryId: newCategory.id },
      });
      return newCategory;
    });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría creada exitosamente', data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateCategory(id: string, data: { name: string; slug: string }) {
  try {
    await requireAdmin();
    const category = await prisma.category.update({ where: { id }, data });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría actualizada exitosamente', data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin();

    if (id === DEFAULT_CATEGORY_ID) {
      return { success: false, message: 'No se puede eliminar la categoría predeterminada del sistema' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.upsert({
        where: { id: DEFAULT_CATEGORY_ID },
        create: { id: DEFAULT_CATEGORY_ID, name: 'Sin categoría', slug: 'sin-categoria' },
        update: {},
      });

      await tx.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: DEFAULT_CATEGORY_ID },
      });

      await tx.category.delete({ where: { id } });
    });

    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría eliminada exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ─── SUB-CATEGORIES ──────────────────────────────────────────────────────────

export async function getAllSubCategories() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    return { success: true, data: subCategories };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getSubCategoriesByCategoryId(categoryId: string) {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: subCategories };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createSubCategory(data: {
  name: string;
  slug: string;
  categoryId: string;
}) {
  try {
    await requireAdmin();
    const subCategory = await prisma.subCategory.create({ data });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Sub-categoría creada exitosamente', data: subCategory };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateSubCategory(
  id: string,
  data: { name: string; slug: string; categoryId: string }
) {
  try {
    await requireAdmin();
    const subCategory = await prisma.subCategory.update({ where: { id }, data });
    revalidatePath('/admin/categories');
    return {
      success: true,
      message: 'Sub-categoría actualizada exitosamente',
      data: subCategory,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteSubCategory(id: string) {
  try {
    await requireAdmin();
    await prisma.subCategory.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Sub-categoría eliminada exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
