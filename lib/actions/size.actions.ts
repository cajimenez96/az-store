'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';

export async function getSizesByCategory(categoryId: string) {
  try {
    const sizes = await prisma.size.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: sizes };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createSize(data: { name: string; categoryId: string }) {
  try {
    const size = await prisma.size.create({ data });
    revalidatePath('/admin/categories'); // Because sizes will likely be managed on the categories page or similar
    return { success: true, message: 'Talle creado exitosamente', data: size };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteSize(id: string) {
  try {
    await prisma.size.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Talle eliminado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
