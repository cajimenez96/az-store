import { prisma } from '@/db/prisma';
import { round2 } from '@/lib/utils';
import type { PriceMethod } from './price-method';

// Deliberately NOT a 'use server' module: nothing here may be callable from the client.

// The only data the client is allowed to choose; everything else comes from the DB.
export type QuoteInput = {
  productId: string;
  size?: string;
  productColorId?: string;
  qty: number;
};

export type QuoteLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  size?: string;
  productColorId?: string;
  colorName?: string;
  colorHex?: string;
  qty: number;
  priceUsed: string;
  paymentMethod: PriceMethod;
};

export type Quote = {
  lines: QuoteLine[];
  itemsPrice: number;
};

// Thrown when the exact variant exists but cannot cover the requested qty.
export class InsufficientStockError extends Error {
  available: number;

  constructor(productName: string, available: number) {
    super(`No hay suficiente stock de ${productName}`);
    this.name = 'InsufficientStockError';
    this.available = available;
  }
}

type Db = Pick<typeof prisma, 'product'>;

export async function resolveLine(
  input: QuoteInput,
  method: PriceMethod,
  db: Db = prisma
): Promise<QuoteLine> {
  const product = await db.product.findFirst({
    where: { id: input.productId },
    include: {
      prices: true,
      variants: { include: { size: true, productColor: { include: { color: true } } } },
    },
  });
  if (!product) throw new Error('Producto no encontrado');
  if (!product.isActive) throw new Error('Este producto no está disponible actualmente');

  // Stock is tracked per exact variant (size + color), never per product.
  const variant = product.variants.find((v) => {
    if (v.size?.name !== input.size) return false;
    if (product.hasColorVariants) return !!input.productColorId && v.colorId === input.productColorId;
    return true;
  });
  if (!variant) throw new Error('Variante (talle/color) no encontrada');
  // An invalid qty is not a stock shortage: callers clamp on InsufficientStockError.
  if (!Number.isInteger(input.qty) || input.qty < 1) throw new Error('Cantidad no válida');
  if (variant.stock < input.qty) {
    throw new InsufficientStockError(product.name, variant.stock);
  }

  const price = product.prices.find((p) => p.paymentMethod === method);
  if (!price) {
    throw new Error(
      `No hay precio configurado para el producto ${product.id} con método ${method}`
    );
  }

  const productColor = product.hasColorVariants ? variant.productColor : null;

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: productColor?.images[0] ?? product.images[0] ?? '/placeholder.png',
    ...(input.size !== undefined && { size: input.size }),
    ...(productColor && {
      productColorId: productColor.id,
      colorName: productColor.color.name,
      colorHex: productColor.color.hex,
    }),
    qty: input.qty,
    priceUsed: price.value.toString(),
    paymentMethod: method,
  };
}

export async function quoteItems(
  inputs: QuoteInput[],
  method: PriceMethod,
  db: Db = prisma
): Promise<Quote> {
  const lines: QuoteLine[] = [];
  // Lines may target the same variant; stock must hold for their combined qty.
  const committedQty = new Map<string, number>();
  for (const input of inputs) {
    const variantKey = [input.productId, input.size ?? '', input.productColorId ?? ''].join('|');
    const combinedQty = (committedQty.get(variantKey) ?? 0) + input.qty;
    const line = await resolveLine({ ...input, qty: combinedQty }, method, db);
    committedQty.set(variantKey, combinedQty);
    lines.push({ ...line, qty: input.qty });
  }
  const itemsPrice = round2(
    lines.reduce((acc, line) => acc + Number(line.priceUsed) * line.qty, 0)
  );
  return { lines, itemsPrice };
}
