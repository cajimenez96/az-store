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
  if (input.qty < 1 || variant.stock < input.qty) {
    throw new Error(`No hay suficiente stock de ${product.name}`);
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
  for (const input of inputs) {
    lines.push(await resolveLine(input, method, db));
  }
  const itemsPrice = round2(
    lines.reduce((acc, line) => acc + Number(line.priceUsed) * line.qty, 0)
  );
  return { lines, itemsPrice };
}
