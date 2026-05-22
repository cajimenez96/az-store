'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';

export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { sizes: true }
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
      include: { sizes: true }
    });
    return { success: true, data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createCategory(data: { name: string; slug: string }) {
  try {
    const category = await prisma.category.create({ data });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría creada exitosamente', data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateCategory(id: string, data: { name: string; slug: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría actualizada exitosamente', data: category };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoría eliminada exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
