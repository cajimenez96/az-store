'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { sizes: true, subCategories: { orderBy: { name: 'asc' } } },
    });
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

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
    const category = await prisma.category.create({ data });
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
    await prisma.category.delete({ where: { id } });
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
