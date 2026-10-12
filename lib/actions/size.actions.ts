'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { assertAdmin, assertAdminOrSeller } from '../auth-guard';
import { insertSizeSchema, uuidSchema } from '../validators';

function prismaCode(error: unknown): string | undefined {
  const e = error as { name?: string; code?: string };
  return e?.name === 'PrismaClientKnownRequestError' ? e.code : undefined;
}

function describeUsage(count?: number): string {
  if (count === undefined) return 'lo usan variantes de producto';
  if (count === 1) return 'lo usa 1 variante de producto';
  return `lo usan ${count} variantes de producto`;
}

function sizeInUseMessage(name: string | undefined, count?: number) {
  const label = name ? ` "${name}"` : '';
  return `No se puede eliminar el talle${label}: ${describeUsage(count)}. Quitá esas variantes primero.`;
}

// Expected failures (access denied, validation, mapped Prisma races) are not logged
function isExpectedFailure(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  if (name === 'UnauthorizedError' || name === 'ZodError') return true;
  const code = prismaCode(error);
  return code === 'P2003' || code === 'P2025';
}

function failureMessage(action: string, error: unknown): string {
  if (!isExpectedFailure(error)) {
    console.error(`[sizes] ${action} failed`, error);
  }
  return formatError(error);
}

// The write already succeeded: a stale cache must not turn it into a reported failure
function revalidateSizes() {
  try {
    revalidatePath('/admin/categories');
  } catch (error) {
    console.error('[sizes] revalidate failed', error);
  }
}

export async function getSizesByCategory(categoryId: string) {
  try {
    await assertAdminOrSeller();
    const parsedId = uuidSchema.parse(categoryId);
    const sizes = await prisma.size.findMany({
      where: { categoryId: parsedId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: sizes };
  } catch (error) {
    return { success: false, message: failureMessage('getSizesByCategory', error) };
  }
}

export async function createSize(data: { name: string; categoryId: string }) {
  try {
    await assertAdmin();
    // Build the persisted object explicitly: extra keys (id, variants, ...) are dropped
    const { name, categoryId } = insertSizeSchema.parse(data);

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return { success: false, message: 'La categoría no existe' };
    }

    const size = await prisma.size.create({ data: { name, categoryId } });
    revalidateSizes(); // Because sizes will likely be managed on the categories page or similar
    return { success: true, message: 'Talle creado exitosamente', data: size };
  } catch (error) {
    // Race: the category was deleted between the existence check and the create
    if (prismaCode(error) === 'P2003') {
      return { success: false, message: 'La categoría no existe' };
    }
    return { success: false, message: failureMessage('createSize', error) };
  }
}

export async function deleteSize(id: string) {
  try {
    await assertAdmin();
    const sizeId = uuidSchema.parse(id);

    const size = await prisma.size.findUnique({ where: { id: sizeId } });
    if (!size) {
      return { success: false, message: 'El talle no existe' };
    }

    const variantCount = await prisma.productVariant.count({ where: { sizeId } });
    if (variantCount > 0) {
      return { success: false, message: sizeInUseMessage(size.name, variantCount) };
    }

    await prisma.size.delete({ where: { id: sizeId } });
    revalidateSizes();
    return { success: true, message: 'Talle eliminado exitosamente' };
  } catch (error) {
    // Races between the checks above and the delete itself
    const code = prismaCode(error);
    if (code === 'P2003') {
      return { success: false, message: sizeInUseMessage(undefined) };
    }
    if (code === 'P2025') {
      return { success: false, message: 'El talle no existe' };
    }
    return { success: false, message: failureMessage('deleteSize', error) };
  }
}
