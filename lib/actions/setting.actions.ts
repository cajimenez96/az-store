'use server';

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../auth-guard';

// Get a setting by key, returns default value if not found
export async function getSetting(key: string, defaultValue: string = '') {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

// Set a setting value
export async function setSetting(key: string, value: string) {
  try {
    await requireAdmin();
    
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    revalidatePath('/admin/overview');
    return { success: true, message: 'Configuración actualizada' };
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return { success: false, message: 'Error al actualizar configuración' };
  }
}
