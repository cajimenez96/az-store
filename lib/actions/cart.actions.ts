'use server';

import { cookies } from 'next/headers';
import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { addToCartSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getShippingSettings } from './settings.actions';
import { v4 as uuidv4 } from 'uuid';
import { InsufficientStockError, resolveLine } from '../pricing/quote';
import { calcTax } from '../pricing/totals';

// Calculate cart prices
// Note: shippingPrice is always 0 in cart. It's calculated in checkout based on shipping method (retiro/envío)
const calcPrice = async (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.priceUsed) * item.qty, 0)
    ),
    shippingPrice = 0, // Always 0 in cart, adjusted during checkout
    taxPrice = calcTax(itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

const cartItemKey = (item: { productId: string; size?: string; productColorId?: string }) =>
  [item.productId, item.size ?? '', item.productColorId ?? ''].join('|');

// Re-resolves every item from the database (web cart always shows the LIST/MERCADOPAGO price).
// Same variant lines are combined; qty is clamped to the variant stock; items that
// cannot be resolved any more (inactive product, variant gone, no price) are dropped.
// NOT exported: this file is 'use server', every export is a public Server Action.
const reconcileItems = async (items: CartItem[]): Promise<CartItem[]> => {
  const desired = new Map<string, CartItem>();
  for (const item of items) {
    const key = cartItemKey(item);
    const current = desired.get(key);
    if (current) current.qty += item.qty;
    else desired.set(key, { ...item });
  }

  const reconciled: CartItem[] = [];
  for (const item of desired.values()) {
    const input = {
      productId: item.productId,
      size: item.size,
      productColorId: item.productColorId,
    };
    try {
      reconciled.push(await resolveLine({ ...input, qty: item.qty }, 'MERCADOPAGO'));
    } catch (error) {
      if (error instanceof InsufficientStockError && error.available > 0) {
        reconciled.push(await resolveLine({ ...input, qty: error.available }, 'MERCADOPAGO'));
      }
      // Any other failure (or no stock at all): drop the item.
    }
  }
  return reconciled;
};

// Only productId / size / productColorId are read from the client; everything else is resolved server-side.
export async function addItemToCart(data: { productId: string; size?: string; productColorId?: string }) {
  try {
    // Get cart session ID and user ID
    let sessionCartId = (await cookies()).get('sessionCartId')?.value;
    const session = await auth();
    let userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Generate new sessionCartId if missing (user cleared cookies)
    if (!sessionCartId) {
      sessionCartId = uuidv4();
      (await cookies()).set('sessionCartId', sessionCartId, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    // Verify user exists to prevent foreign key errors with stale sessions
    if (userId) {
      const userExists = await prisma.user.findFirst({ where: { id: userId } });
      if (!userExists) {
        userId = undefined;
      }
    }

    // Get cart
    const cart = await getMyCart();

    // Parse the client input: unknown fields (price, name, qty...) are stripped
    const input = addToCartSchema.parse(data);

    // Qty is never client-controlled: one more unit than what the cart already holds
    const existItem = (cart?.items as CartItem[] | undefined)?.find(
      (x) => cartItemKey(x) === cartItemKey(input)
    );
    const targetQty = (existItem?.qty ?? 0) + 1;

    // Name, slug, image, price and stock come from the database
    const line = await resolveLine({ ...input, qty: targetQty }, 'MERCADOPAGO');

    if (!cart) {
      // Create new cart object
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [line],
        sessionCartId: sessionCartId,
        ...(await calcPrice([line])),
      });

      // Add to database
      await prisma.cart.create({
        data: {
          ...newCart,
          updatedAt: new Date(),
        },
      });
    } else {
      const items = existItem
        ? (cart.items as CartItem[]).map((x) => (x === existItem ? line : x))
        : [...(cart.items as CartItem[]), line];

      // Save to database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: items as Prisma.CartUpdateitemsInput[],
          ...(await calcPrice(items)),
          updatedAt: new Date(),
        },
      });
    }

    revalidatePath(`/product/${line.slug}`);

    return {
      success: true,
      message: `${line.name} ${existItem ? 'actualizado en el' : 'agregado al'} carrito`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // Get cart session ID and user ID
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  const session = await auth();
  let userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Verify user exists to prevent foreign key errors with stale sessions
  if (userId) {
    const userExists = await prisma.user.findFirst({ where: { id: userId } });
    if (!userExists) {
      userId = undefined;
    }
  }

  // If no user and no session ID, return undefined
  if (!userId && !sessionCartId) return undefined;

  // Get user cart from database - prioritize user cart over session cart
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId, userId: null },
  });

  if (!cart) return undefined;

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export async function removeItemFromCart(
  productId: string,
  size?: string,
  productColorId?: string
) {
  try {
    // Get Product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) throw new Error('Producto no encontrado');

    // Get user cart
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: 'Carrito no encontrado',
      };
    }

    // Check for item (match por size + color)
    const exist = (cart.items as CartItem[]).find(
      (x) =>
        x.productId === productId &&
        x.size === size &&
        x.productColorId === productColorId
    );
    if (!exist) throw new Error('Artículo no encontrado');

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart
      cart.items = (cart.items as CartItem[]).filter(
        (x) =>
          !(
            x.productId === exist.productId &&
            x.size === exist.size &&
            x.productColorId === exist.productColorId
          )
      );
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find(
        (x) =>
          x.productId === productId &&
          x.size === size &&
          x.productColorId === productColorId
      )!.qty = exist.qty - 1;
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...(await calcPrice(cart.items as CartItem[])),
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} fue eliminado del carrito`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Merge anonymous cart into user cart
export async function mergeCart(userId: string, sessionCartId: string) {
  try {
    // 1. Get user's cart
    const userCart = await prisma.cart.findFirst({
      where: { userId },
    });

    // 2. Get session cart
    const sessionCart = await prisma.cart.findFirst({
      where: { sessionCartId, userId: null },
    });

    if (!sessionCart) return;

    if (!userCart) {
      // If user has no cart, adopt the session cart (re-priced from the database)
      const items = await reconcileItems(sessionCart.items as CartItem[]);
      await prisma.cart.update({
        where: { id: sessionCart.id },
        data: {
          userId,
          items: items as Prisma.CartUpdateitemsInput[],
          ...(await calcPrice(items)),
          updatedAt: new Date(),
        },
      });
    } else {
      // Combine both carts and re-resolve every line from the database
      const items = await reconcileItems([
        ...(userCart.items as CartItem[]),
        ...(sessionCart.items as CartItem[]),
      ]);

      // Update user cart with consolidated items and recalculated prices
      await prisma.cart.update({
        where: { id: userCart.id },
        data: {
          items: items as Prisma.CartUpdateitemsInput[],
          ...(await calcPrice(items)),
          updatedAt: new Date(),
        },
      });

      // Delete the anonymous session cart
      await prisma.cart.delete({
        where: { id: sessionCart.id },
      });
    }
  } catch (error) {
    console.error('Error merging carts:', error);
  }
}
