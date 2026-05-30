'use server';

import { prisma } from '@/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';
import { encryptToken, decryptToken } from '@/lib/encrypt';

const BANK_KEYS = ['BANK_NAME', 'BANK_ACCOUNT_HOLDER', 'BANK_CBU', 'BANK_ALIAS', 'BANK_CUIT'] as const;
const MP_KEYS = ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY'] as const;
const SHIPPING_KEYS = ['FREE_SHIPPING_THRESHOLD', 'SHIPPING_FREE_CITIES'] as const;

export async function getBankSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...BANK_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    bank: map['BANK_NAME'] ?? process.env.BANK_NAME ?? '',
    accountHolder: map['BANK_ACCOUNT_HOLDER'] ?? process.env.BANK_ACCOUNT_HOLDER ?? '',
    cbu: map['BANK_CBU'] ?? process.env.BANK_CBU ?? '',
    alias: map['BANK_ALIAS'] ?? process.env.BANK_ALIAS ?? '',
    cuit: map['BANK_CUIT'] ?? process.env.BANK_CUIT ?? '',
  };
}

export async function updateBankSettings(data: {
  bank: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cuit: string;
}) {
  await requireAdmin();

  const entries: [string, string][] = [
    ['BANK_NAME', data.bank],
    ['BANK_ACCOUNT_HOLDER', data.accountHolder],
    ['BANK_CBU', data.cbu],
    ['BANK_ALIAS', data.alias],
    ['BANK_CUIT', data.cuit],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );

  revalidatePath('/admin/settings');
  revalidatePath('/order');
  return { success: true, message: 'Datos bancarios actualizados' };
}

export async function getMercadoPagoSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...MP_KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
    if (map['MERCADOPAGO_ACCESS_TOKEN']) {
      try {
        accessToken = await decryptToken(map['MERCADOPAGO_ACCESS_TOKEN']);
      } catch {
        accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
      }
    }

    const publicKey =
      map['MERCADOPAGO_PUBLIC_KEY'] ?? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? '';

    return {
      accessToken,
      publicKey,
    };
  } catch (error) {
    console.error('Error getting MercadoPago settings:', error);
    return {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '',
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? '',
    };
  }
}

export async function updateMercadoPagoSettings(data: {
  accessToken: string;
  publicKey: string;
}) {
  await requireAdmin();

  try {
    const encryptedAccessToken = await encryptToken(data.accessToken);

    const entries: [string, string][] = [
      ['MERCADOPAGO_ACCESS_TOKEN', encryptedAccessToken],
      ['MERCADOPAGO_PUBLIC_KEY', data.publicKey],
    ];

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
      )
    );

    revalidatePath('/admin/settings');
    return { success: true, message: 'Datos de MercadoPago actualizados' };
  } catch (error) {
    console.error('Error updating MercadoPago settings:', error);
    return { success: false, message: 'Error al actualizar datos de MercadoPago' };
  }
}

export async function getShippingSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SHIPPING_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const freeShippingThreshold = parseFloat(
    map['FREE_SHIPPING_THRESHOLD'] ?? process.env.FREE_SHIPPING_THRESHOLD ?? '60000'
  );
  const freeShippingCities = map['SHIPPING_FREE_CITIES']
    ? JSON.parse(map['SHIPPING_FREE_CITIES'])
    : ['San Miguel de Tucumán', 'Tafí Viejo', 'La Banda del Río Salí'];

  return {
    freeShippingThreshold,
    freeShippingCities,
  };
}

export async function updateShippingSettings(data: {
  freeShippingThreshold: number;
  freeShippingCities: string[];
}) {
  await requireAdmin();

  const entries: [string, string][] = [
    ['FREE_SHIPPING_THRESHOLD', data.freeShippingThreshold.toString()],
    ['SHIPPING_FREE_CITIES', JSON.stringify(data.freeShippingCities)],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );

  revalidatePath('/admin/settings');
  revalidatePath('/order');
  revalidatePath('/place-order');
  revalidatePath('/');
  return { success: true, message: 'Configuración de envíos actualizada' };
}
