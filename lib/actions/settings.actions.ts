'use server';

import { prisma } from '@/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

const BANK_KEYS = ['BANK_NAME', 'BANK_ACCOUNT_HOLDER', 'BANK_CBU', 'BANK_ALIAS', 'BANK_CUIT'] as const;

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
