'use server';

import { cookies } from 'next/headers';
import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { cartItemSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('No se encontró la sesión del carrito');

    // Get session and user ID
    const session = await auth();
    let userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Verify user exists to prevent foreign key errors with stale sessions
    if (userId) {
      const userExists = await prisma.user.findFirst({ where: { id: userId } });
      if (!userExists) {
        userId = undefined;
      }
    }

    // Get cart
    const cart = await getMyCart();

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    // Find product in database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
      include: { variants: { include: { size: true } } },
    });
    if (!product) throw new Error('Producto no encontrado');

    let maxStock = 0;
    if (item.size && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.size.name === item.size);
      if (!variant) throw new Error('Talle no encontrado');
      maxStock = variant.stock;
    } else {
      // If no variants, maybe just fallback to a generic stock or assume 0
      maxStock = 0; // Or whatever fallback
    }

    if (!cart) {
      // Create new cart object
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcPrice([item]),
      });

      // Add to database
      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} agregado al carrito`,
      };
    } else {
      // Check if item is already in cart
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId && x.size === item.size
      );

      if (existItem) {
        // Check stock
        if (maxStock < existItem.qty + 1) {
          throw new Error('No hay suficiente stock');
        }

        // Increase the quantity
        (cart.items as CartItem[]).find(
          (x) => x.productId === item.productId && x.size === item.size
        )!.qty = existItem.qty + 1;
      } else {
        // If item does not exist in cart
        // Check stock
        if (maxStock < 1) throw new Error('No hay suficiente stock');

        // Add item to the cart.items
        cart.items.push(item);
      }

      // Save to database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existItem ? 'actualizado en el' : 'agregado al'
        } carrito`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('No se encontró la sesión del carrito');

  // Get session and user ID
  const session = await auth();
  let userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Verify user exists to prevent foreign key errors with stale sessions
  if (userId) {
    const userExists = await prisma.user.findFirst({ where: { id: userId } });
    if (!userExists) {
      userId = undefined;
    }
  }

  // Get user cart from database
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

export async function removeItemFromCart(productId: string, size?: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('No se encontró la sesión del carrito');

    // Get Product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) throw new Error('Producto no encontrado');

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error('Carrito no encontrado');

    // Check for item
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId && x.size === size
    );
    if (!exist) throw new Error('Artículo no encontrado');

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart
      cart.items = (cart.items as CartItem[]).filter(
        (x) => !(x.productId === exist.productId && x.size === exist.size)
      );
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find(
        (x) => x.productId === productId && x.size === size
      )!.qty = exist.qty - 1;
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
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
      // If user has no cart, associate the session cart to the user
      await prisma.cart.update({
        where: { id: sessionCart.id },
        data: { userId },
      });
    } else {
      const userItems = userCart.items as CartItem[];
      const sessionItems = sessionCart.items as CartItem[];

      for (const sessionItem of sessionItems) {
        const existItem = userItems.find((x) => x.productId === sessionItem.productId && x.size === sessionItem.size);

        // Fetch product to verify stock
        const product = await prisma.product.findFirst({
          where: { id: sessionItem.productId },
          include: { variants: { include: { size: true } } }
        });

        let maxStock = 0;
        if (sessionItem.size && product?.variants && product.variants.length > 0) {
          const variant = product.variants.find((v) => v.size.name === sessionItem.size);
          if (variant) {
            maxStock = variant.stock;
          }
        }

        if (existItem) {
          const newQty = existItem.qty + sessionItem.qty;
          existItem.qty = newQty > maxStock ? maxStock : newQty;
        } else {
          // Limit qty to stock
          const newQty = sessionItem.qty > maxStock ? maxStock : sessionItem.qty;
          userItems.push({
            ...sessionItem,
            qty: newQty,
          });
        }
      }

      // Update user cart with consolidated items and recalculated prices
      await prisma.cart.update({
        where: { id: userCart.id },
        data: {
          items: userItems as Prisma.CartUpdateitemsInput[],
          ...calcPrice(userItems),
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
