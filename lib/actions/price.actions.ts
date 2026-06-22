'use server';

import { prisma } from '@/db/prisma';
import { getSetting } from './setting.actions';
import {
  MP_SURCHARGE_PERCENT_DEFAULT,
  PaymentMethod as InternalPaymentMethod,
} from '@/lib/constants';

/**
 * Devuelve el recargo de MercadoPago configurado (en %).
 * Si no está en la DB, retorna el default (10%).
 */
export async function getMpSurchargePercent(): Promise<number> {
  const raw = await getSetting('MP_SURCHARGE_PERCENT', String(MP_SURCHARGE_PERCENT_DEFAULT));
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : MP_SURCHARGE_PERCENT_DEFAULT;
}

/**
 * Sugiere un `priceMercadoPago` a partir de `priceCash` aplicando el recargo
 * configurado. Devuelve un string con 2 decimales listo para el form.
 */
export async function suggestMpPrice(priceCash: number | string): Promise<string> {
  const percent = await getMpSurchargePercent();
  const cash = typeof priceCash === 'string' ? Number(priceCash) : priceCash;
  if (!Number.isFinite(cash) || cash <= 0) return '0.00';
  return (cash * (1 + percent / 100)).toFixed(2);
}

/**
 * Devuelve el mapa de precios normalizado de un producto: { CASH, MERCADOPAGO }.
 * Si falta algún método, devuelve '0.00'.
 */
export async function getPriceMapForProduct(
  productId: string,
): Promise<Record<InternalPaymentMethod, string>> {
  const rows = await prisma.price.findMany({
    where: { productId },
  });
  const map: Record<InternalPaymentMethod, string> = {
    CASH: '0.00',
    MERCADOPAGO: '0.00',
  };
  for (const r of rows) {
    map[r.paymentMethod as InternalPaymentMethod] = r.value.toString();
  }
  return map;
}

/**
 * Resuelve el precio a aplicar a un item del carrito según el método de pago.
 * Devuelve el valor numérico (string con 2 decimales) y, si no se encuentra,
 * tira un error con mensaje claro.
 */
export async function resolvePriceUsed(
  productId: string,
  method: InternalPaymentMethod,
): Promise<string> {
  const row = await prisma.price.findUnique({
    where: { productId_paymentMethod: { productId, paymentMethod: method } },
  });
  if (!row) {
    throw new Error(
      `No hay precio configurado para el producto ${productId} con método ${method}`,
    );
  }
  return row.value.toString();
}
