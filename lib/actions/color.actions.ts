'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertColorSchema, updateColorSchema } from '../validators';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

// Get all colors (para /admin/colors)
export async function getAllColors() {
  const data = await prisma.color.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { productColors: true },
      },
    },
  });
  return data;
}

// Get single color by ID
export async function getColorById(colorId: string) {
  const data = await prisma.color.findFirst({
    where: { id: colorId },
  });
  return data;
}

// Búsqueda de colores para el combobox del form de producto
// Devuelve un set liviano (id, name, hex) sin joins
export async function searchColors(query: string) {
  const trimmed = query?.trim() ?? '';
  const where = trimmed
    ? {
        name: {
          contains: trimmed,
          mode: 'insensitive' as const,
        },
      }
    : {};
  const data = await prisma.color.findMany({
    where,
    select: { id: true, name: true, hex: true },
    orderBy: { name: 'asc' },
    take: 50,
  });
  return data;
}

// Create a color
export async function createColor(data: z.infer<typeof insertColorSchema>) {
  try {
    await requireAdmin();
    const colorData = insertColorSchema.parse(data);

    const existing = await prisma.color.findFirst({
      where: { name: { equals: colorData.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new Error('Un color con este nombre ya existe');
    }

    const created = await prisma.color.create({ data: colorData });

    revalidatePath('/admin/colors');
    return { success: true, message: 'Color creado exitosamente', data: created };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a color
export async function updateColor(data: z.infer<typeof updateColorSchema>) {
  try {
    await requireAdmin();
    const colorData = updateColorSchema.parse(data);

    const exists = await prisma.color.findFirst({ where: { id: colorData.id } });
    if (!exists) throw new Error('Color no encontrado');

    const nameClash = await prisma.color.findFirst({
      where: {
        name: { equals: colorData.name, mode: 'insensitive' },
        id: { not: colorData.id },
      },
    });
    if (nameClash) throw new Error('Un color con este nombre ya existe');

    await prisma.color.update({
      where: { id: colorData.id },
      data: { name: colorData.name, hex: colorData.hex },
    });

    revalidatePath('/admin/colors');
    return { success: true, message: 'Color actualizado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Delete a color — falla si está en uso por algún ProductColor
export async function deleteColor(id: string) {
  try {
    await requireAdmin();

    const exists = await prisma.color.findFirst({ where: { id } });
    if (!exists) throw new Error('Color no encontrado');

    const inUse = await prisma.productColor.count({ where: { colorId: id } });
    if (inUse > 0) {
      throw new Error(
        `No se puede eliminar: el color está siendo usado en ${inUse} producto(s)`
      );
    }

    await prisma.color.delete({ where: { id } });
    revalidatePath('/admin/colors');
    return { success: true, message: 'Color eliminado exitosamente' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
