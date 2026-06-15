'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { requireAdmin, requireAdminOrSeller } from '../auth-guard';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertOrderSchema, updateShippingStatusSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult, ShippingAddress } from '@/types';
import { paypal } from '../paypal';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import {
  sendPurchaseReceipt,
  sendNewSaleNotification,
  sendShippingUpdate,
  sendTransferApproved,
  sendTransferRejected,
  sendSaleNotification,
} from '../email';
import { Preference } from 'mercadopago';
import { getMercadoPagoClient } from '../mercadopago';
import { getBankSettings } from './settings.actions';
import { deleteUTFiles } from '../uploadthing-helpers';

// Create order and create the order items
export async function createOrder({
  shippingMethod,
  promoCode: promoCodeInput,
  bannerId,
  bannerDiscount: clientBannerDiscount = 0,
}: {
  shippingMethod: 'retiro' | 'envio';
  promoCode?: string;
  bannerId?: string;
  bannerDiscount?: number;
}) {
  try {
    const session = await auth();
    if (!session) throw new Error('Usuario no autenticado');

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Usuario no encontrado');

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: 'Tu carrito está vacío',
        redirectTo: '/cart',
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: 'No hay dirección de envío',
        redirectTo: '/shipping-address',
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: 'No hay método de pago',
        redirectTo: '/payment-method',
      };
    }

    // Validate and apply promo code (security: validate on server side)
    let promoCodeId: string | null = null;
    let discountPrice = 0;

    if (promoCodeInput) {
      const normalizedCode = promoCodeInput.toUpperCase();
      const promoCode = await prisma.promoCode.findUnique({
        where: { code: normalizedCode },
      });

      if (!promoCode) {
        return {
          success: false,
          message: 'Código promocional no válido',
        };
      }

      if (!promoCode.isActive) {
        return {
          success: false,
          message: 'Este código promocional no está activo',
        };
      }

      const now = new Date();
      if (promoCode.startsAt && now < promoCode.startsAt) {
        return {
          success: false,
          message: 'Este código promocional aún no está disponible',
        };
      }

      if (promoCode.endsAt && now > promoCode.endsAt) {
        return {
          success: false,
          message: 'Este código promocional ha expirado',
        };
      }

      // Check usage limit
      if (promoCode.maxUsesPerUser) {
        const usageCount = await prisma.promoCodeUsage.count({
          where: {
            promoCodeId: promoCode.id,
            userId,
          },
        });

        if (usageCount >= promoCode.maxUsesPerUser) {
          return {
            success: false,
            message: `Ya has alcanzado el límite de usos para este código (${promoCode.maxUsesPerUser})`,
          };
        }
      }

      promoCodeId = promoCode.id;

      // Pick the discount for the user's selected payment method. POS methods
      // are blocked entirely; codes without a value for the chosen method are
      // rejected with a clear message (the API route does the same check, but
      // we re-validate here because the client cannot be trusted).
      if (user.paymentMethod.startsWith('PuntoDeVenta')) {
        return {
          success: false,
          message: 'Los cupones no aplican a pagos en punto de venta',
        };
      }

      const appliedPercent =
        user.paymentMethod === 'TransferenciaBancaria'
          ? Number(promoCode.discountPercentTransferencia)
          : Number(promoCode.discountPercentMercadoPago);

      if (!appliedPercent || appliedPercent <= 0) {
        return {
          success: false,
          message: 'Este cupón no aplica para el método de pago elegido',
        };
      }

      discountPrice = Number(
        (Number(cart.itemsPrice) * (appliedPercent / 100)).toFixed(2)
      );
    }

    // Validate and calculate banner discount (server-side — only on banner products)
    let verifiedBannerDiscount = 0;
    let validBannerId: string | null = null;

    if (bannerId) {
      const now = new Date();
      const banner = await prisma.promoBanner.findFirst({
        where: {
          id: bannerId,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        select: {
          id: true,
          discountPercent: true,
          products: { select: { id: true } },
        },
      });

      if (banner?.discountPercent && banner.products.length > 0) {
        const bannerProductIds = new Set(banner.products.map((p) => p.id));
        const bannerItemsTotal = (cart.items as CartItem[])
          .filter((item) => bannerProductIds.has(item.productId))
          .reduce((sum, item) => sum + Number(item.priceUsed) * item.qty, 0);
        verifiedBannerDiscount = Number(
          ((bannerItemsTotal * banner.discountPercent) / 100).toFixed(2)
        );
        validBannerId = banner.id;
      }
    }

    // Calculate order prices
    const itemsPrice = Number(cart.itemsPrice);
    const itemsAfterDiscount =
      itemsPrice - discountPrice - verifiedBannerDiscount;
    const totalPrice =
      itemsAfterDiscount + Number(cart.shippingPrice) + Number(cart.taxPrice);

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: itemsPrice.toString(),
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: totalPrice.toString(),
    }) as any;

    // Add promo code information
    if (promoCodeId) {
      order.promoCode = promoCodeInput!.toUpperCase();
      order.discountPrice = discountPrice.toString();
    }

    // Add banner discount information
    if (validBannerId && verifiedBannerDiscount > 0) {
      order.bannerId = validBannerId;
      order.bannerDiscount = verifiedBannerDiscount.toString();
    }

    const expirationHours = process.env.ORDER_EXPIRATION_HOURS
      ? Number(process.env.ORDER_EXPIRATION_HOURS)
      : 24;
    const mpExpirationMinutes = process.env.MP_EXPIRATION_MINUTES
      ? Number(process.env.MP_EXPIRATION_MINUTES)
      : 30;

    let expiresAt: Date | null = null;
    if (user.paymentMethod === 'TransferenciaBancaria') {
      expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    } else if (user.paymentMethod === 'MercadoPago') {
      expiresAt = new Date(Date.now() + mpExpirationMinutes * 60 * 1000);
    }

    // Create a transaction to create order and order items in database
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      // Create order
      const insertedOrder = await tx.order.create({
        data: {
          ...order,
          expiresAt,
        },
      });
      // Create order items from the cart items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            image: item.image,
            qty: item.qty,
            size: item.size ?? null,
            // Fase 2: snapshoteo priceUsed + paymentMethod
            priceUsed: item.priceUsed,
            paymentMethod: item.paymentMethod,
            productColorId: item.productColorId ?? null,
            colorName: item.colorName ?? null,
            colorHex: item.colorHex ?? null,
            orderId: insertedOrder.id,
          },
        });

        // Decrement stock immediately if Bank Transfer
        if (user.paymentMethod === 'TransferenciaBancaria') {
          if (item.size || item.productColorId) {
            const variant = await tx.productVariant.findFirst({
              where: {
                productId: item.productId,
                size: item.size ? { name: item.size } : undefined,
                colorId: item.productColorId ?? null,
              },
            });
            if (variant) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: { decrement: item.qty } },
              });
            }
          }
        }
      }
      // Register promo code usage
      if (promoCodeId) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId,
            userId,
            orderId: insertedOrder.id,
          },
        });
      }

      // Clear cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error('No se pudo crear la orden');

    // Send confirmation email and seller notifications asynchronously
    (async () => {
      try {
        const createdOrder = await getOrderById(insertedOrderId);
        if (createdOrder) {
          let bankInfo;
          if (user.paymentMethod === 'TransferenciaBancaria') {
            bankInfo = await getBankSettings();
          }

          await sendPurchaseReceipt({
            order: {
              ...createdOrder,
              user: { name: user.name || 'Cliente', email: user.email },
            } as any,
            bankInfo,
          });

          // Send sale notifications to sellers
          await Promise.all(
            (createdOrder.orderitems as any[]).map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { sellerId: true },
              });

              if (product?.sellerId) {
                const seller = await prisma.user.findUnique({
                  where: { id: product.sellerId },
                  select: { email: true, name: true },
                });

                if (seller?.email) {
                  await sendSaleNotification({
                    sellerEmail: seller.email,
                    sellerName: seller.name || 'Vendedor',
                    productName: item.name,
                    qty: item.qty,
                    price: item.priceUsed,
                  });
                }
              }
            })
          );
        }
      } catch (error) {
        console.error('Failed to send emails:', error);
      }
    })();

    return {
      success: true,
      message: 'Orden creada',
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}

// Get order by id
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  });

  return convertToPlainObject(data);
}

// Create new paypal order
export async function createPayPalOrder(orderId: string) {
  try {
    // Get order from database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (order) {
      // Create paypal order
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

      // Update order with paypal order id
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: paypalOrder.id,
            email_address: '',
            status: '',
            pricePaid: 0,
          },
        },
      });

      return {
        success: true,
        message: 'Orden creada exitosamente',
        data: paypalOrder.id,
      };
    } else {
      throw new Error('Orden no encontrada');
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Approve paypal order and update order to paid
export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  try {
    // Get order from database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error('Orden no encontrada');

    const captureData = await paypal.capturePayment(data.orderID);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Error en el pago de PayPal');
    }

    // Update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid:
          captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Tu orden ha sido pagada',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update order to paid
export async function updateOrderToPaid({
  orderId,
  paymentResult,
  mpPaymentId,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
  mpPaymentId?: string;
}) {
  // Idempotency: reject duplicate MP payment IDs before any DB write
  if (mpPaymentId) {
    const existing = await prisma.order.findFirst({ where: { mpPaymentId } });
    if (existing) throw new Error('La orden ya está pagada');
  }

  // Get order from database
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
    },
  });

  if (!order) throw new Error('Orden no encontrada');

  if (order.isPaid) throw new Error('La orden ya está pagada');

  // Transaction to update order and account for product stock
  await prisma.$transaction(async (tx) => {
    // Iterate over products and update stock only if it wasn't decremented on creation
    if (order.paymentMethod !== 'TransferenciaBancaria') {
      for (const item of order.orderitems) {
        if (item.size || item.productColorId) {
          const variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: item.size ? { name: item.size } : undefined,
              colorId: item.productColorId ?? null,
            },
          });

          if (!variant) {
            throw new Error(
              `Variante no encontrada: producto ${item.productId}, talle ${item.size ?? '—'}, color ${item.colorName ?? '—'}`
            );
          }

          // Guard atómico: decrementa solo si hay stock suficiente.
          // Previene stock negativo en compras simultáneas (race condition).
          const affected = await tx.$executeRawUnsafe(
            `UPDATE "ProductVariant" SET stock = stock - $1 WHERE id = $2::uuid AND stock >= $3`,
            item.qty,
            variant.id,
            item.qty
          );

          if (affected === 0) {
            throw new Error(
              `Stock insuficiente para el talle ${item.size ?? '—'} / color ${item.colorName ?? '—'}. No se puede confirmar el pago.`
            );
          }
        }
      }
    }

    // Set the order to paid
    await tx.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
        ...(mpPaymentId ? { mpPaymentId } : {}),
      },
    });
  });

  // Get updated order after transaction
  const updatedOrder = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!updatedOrder) throw new Error('Orden no encontrada');

  // Fase 2: el shape de `orderData` (que va a las funciones de email) ahora
  // tiene `priceUsed` en `orderitems` (Decimal → string ya aplicado por el
  // `client.$extends` de `db/prisma.ts`).
  const orderData = {
    ...updatedOrder,
    shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
    paymentResult: updatedOrder.paymentResult as PaymentResult,
  };

  sendPurchaseReceipt({
    order: orderData as any,
  });
  sendNewSaleNotification({
    order: orderData as any,
  });
}

// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error('Usuario no autorizado');

  const data = await prisma.order.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session?.user?.id },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

import { getSetting } from './setting.actions';

// Get sales data and order summary
export async function getOrderSummary() {
  // Get counts for each resource
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  // Calculate the total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest sales
  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
    take: 6,
  });

  // Get sales by payment method
  const salesByMethodRaw = await prisma.$queryRaw<
    Array<{ paymentMethod: string; totalSales: Prisma.Decimal }>
  >`SELECT "paymentMethod", sum("totalPrice") as "totalSales" FROM "Order" WHERE "isPaid" = true GROUP BY "paymentMethod"`;

  const salesByMethod = salesByMethodRaw.map((entry) => ({
    paymentMethod: entry.paymentMethod,
    totalSales: Number(entry.totalSales),
  }));

  // Fetch global config for critical stock threshold
  const criticalStockThresholdStr = await getSetting(
    'CRITICAL_STOCK_THRESHOLD',
    '2'
  );
  const criticalStockThreshold = parseInt(criticalStockThresholdStr, 10);

  // Calculate ERP metrics
  const criticalStockCount = await prisma.productVariant.count({
    where: { stock: { lte: criticalStockThreshold } },
  });

  const pendingPaymentsCount = await prisma.order.count({
    where: { isPaid: false },
  });

  const pendingDeliveriesCount = await prisma.order.count({
    where: { isPaid: true, isDelivered: false },
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
    salesByMethod,
    criticalStockCount,
    criticalStockThreshold,
    pendingPaymentsCount,
    pendingDeliveriesCount,
  };
}

// Get all orders
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
  status,
  paymentMethod,
}: {
  limit?: number;
  page: number;
  query: string;
  status?: string;
  paymentMethod?: string;
}) {
  const queryFilter: Prisma.OrderWhereInput =
    query && query !== 'all'
      ? {
          user: {
            name: {
              contains: query,
              mode: 'insensitive',
            } as Prisma.StringFilter,
          },
        }
      : {};

  let statusFilter: Prisma.OrderWhereInput = {};
  if (status === 'pending') {
    statusFilter = { isPaid: false };
  } else if (status === 'paid') {
    statusFilter = { isPaid: true, isDelivered: false };
  } else if (status === 'delivered') {
    statusFilter = { isDelivered: true };
  }

  const paymentMethodFilter: Prisma.OrderWhereInput =
    paymentMethod && paymentMethod !== 'all'
      ? { paymentMethod: { contains: paymentMethod } }
      : {};

  const data = await prisma.order.findMany({
    where: {
      ...queryFilter,
      ...statusFilter,
      ...paymentMethodFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: { user: { select: { name: true } } },
  });

  const dataCount = await prisma.order.count({
    where: {
      ...queryFilter,
      ...statusFilter,
      ...paymentMethodFilter,
    },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete an order
export async function deleteOrder(id: string) {
  try {
    await requireAdmin();
    await prisma.order.delete({ where: { id } });

    revalidatePath('/admin/orders');

    return {
      success: true,
      message: 'Orden eliminada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD order to paid
export async function updateOrderToPaidCOD(orderId: string) {
  try {
    await requireAdminOrSeller();
    await updateOrderToPaid({ orderId });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Orden marcada como pagada' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD order to delivered
export async function deliverOrder(orderId: string) {
  try {
    await requireAdminOrSeller();
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error('Orden no encontrada');
    if (!order.isPaid) throw new Error('La orden no está pagada');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/order/${orderId}`);

    const updatedOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderitems: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (updatedOrder) {
      sendShippingUpdate({
        order: {
          ...updatedOrder,
          shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
          paymentResult: updatedOrder.paymentResult as PaymentResult,
        } as any,
      });
    }

    return {
      success: true,
      message: 'Orden marcada como entregada',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update shipping status
export async function updateShippingStatus(
  orderId: string,
  status: string,
  notes?: string
) {
  try {
    await requireAdminOrSeller();

    // Validate input
    const validated = updateShippingStatusSchema.parse({ status, notes });

    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Orden no encontrada');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingStatus: validated.status,
        shippingNotes: validated.notes || null,
      },
    });

    revalidatePath(`/order/${orderId}`);

    const updatedOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderitems: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (updatedOrder) {
      sendShippingUpdate({
        order: {
          ...updatedOrder,
          shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
          paymentResult: updatedOrder.paymentResult as PaymentResult,
        } as any,
      });
    }

    return {
      success: true,
      message: 'Estado de envío actualizado',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update order receipt URL (client upload)
export async function updateOrderReceipt(orderId: string, receiptUrl: string) {
  try {
    const session = await auth();
    if (!session) throw new Error('Usuario no autenticado');

    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Orden no encontrada');

    if (
      order.userId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'seller'
    ) {
      throw new Error('No autorizado');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { receiptUrl },
    });

    // Si el usuario reemplazó un comprobante anterior, liberamos el asset viejo
    // en UploadThing para no acumular archivos huérfanos.
    if (order.receiptUrl && order.receiptUrl !== receiptUrl) {
      await deleteUTFiles([order.receiptUrl]);
    }

    revalidatePath(`/order/${orderId}`);

    // Send receipt uploaded notification asynchronously
    (async () => {
      try {
        const updatedOrder = await getOrderById(orderId);
        if (updatedOrder) {
          await sendNewSaleNotification({
            order: updatedOrder as any,
          });
        }
      } catch (error) {
        console.error('Failed to send receipt uploaded notification:', error);
      }
    })();

    return {
      success: true,
      message: 'Comprobante de pago guardado correctamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Approve bank transfer (admin)
export async function approveBankTransfer(orderId: string) {
  try {
    await requireAdminOrSeller();

    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Orden no encontrada');

    if (order.paymentMethod !== 'TransferenciaBancaria') {
      throw new Error('El método de pago no es transferencia bancaria');
    }

    if (!order.receiptUrl) {
      throw new Error('No se ha subido ningún comprobante para esta orden');
    }

    await updateOrderToPaid({ orderId });

    revalidatePath(`/order/${orderId}`);
    revalidatePath('/admin/orders');

    // Send transfer approved email asynchronously
    (async () => {
      try {
        const approvedOrder = await getOrderById(orderId);
        if (approvedOrder) {
          await sendTransferApproved({
            order: approvedOrder as any,
          });
        }
      } catch (error) {
        console.error('Failed to send transfer approved email:', error);
      }
    })();

    return {
      success: true,
      message: 'Transferencia bancaria aprobada exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Reject bank transfer (admin)
export async function rejectBankTransfer(orderId: string) {
  try {
    await requireAdminOrSeller();

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { orderitems: true },
    });

    if (!order) throw new Error('Orden no encontrada');

    if (order.paymentMethod !== 'TransferenciaBancaria') {
      throw new Error('El método de pago no es transferencia bancaria');
    }

    // Capturamos la URL del comprobante antes de nulificarla, para poder
    // liberar el asset en UploadThing después de commit.
    const previousReceiptUrl = order.receiptUrl;

    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of order.orderitems) {
        if (item.size || item.productColorId) {
          const variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: item.size ? { name: item.size } : undefined,
              colorId: item.productColorId ?? null,
            },
          });
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.qty } },
            });
          }
        }
      }

      // Mark order as cancelled (clear receiptUrl and update status in paymentResult)
      await tx.order.update({
        where: { id: orderId },
        data: {
          receiptUrl: null,
          paymentResult: { status: 'CANCELLED' },
        },
      });
    });

    // Liberar el comprobante rechazado de UploadThing (si existía).
    if (previousReceiptUrl) {
      await deleteUTFiles([previousReceiptUrl]);
    }

    revalidatePath(`/order/${orderId}`);
    revalidatePath('/admin/orders');

    // Send transfer rejected email asynchronously
    (async () => {
      try {
        const rejectedOrder = await getOrderById(orderId);
        if (rejectedOrder) {
          await sendTransferRejected({
            order: rejectedOrder as any,
          });
        }
      } catch (error) {
        console.error('Failed to send transfer rejected email:', error);
      }
    })();

    return {
      success: true,
      message: 'Transferencia rechazada y stock restaurado',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create Mercado Pago Preference
export async function createMercadoPagoOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { orderitems: true, user: { select: { email: true } } },
    });

    if (!order) throw new Error('Orden no encontrada');

    const mpClient = await getMercadoPagoClient();
    const preference = new Preference(mpClient);

    // Prepare items for Mercado Pago
    const items = order.orderitems.map((item) => ({
      id: item.productId,
      title: item.name,
      quantity: item.qty,
      unit_price: Number(item.priceUsed),
      currency_id: 'ARS',
    }));

    if (Number(order.shippingPrice) > 0) {
      items.push({
        id: 'shipping',
        title: 'Costo de Envío',
        quantity: 1,
        unit_price: Number(order.shippingPrice),
        currency_id: 'ARS',
      });
    }

    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${orderId}`,
          failure: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${orderId}`,
          pending: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${orderId}`,
        },
        auto_return: 'approved',
        external_reference: orderId,
        metadata: { orderId },
        notification_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/webhooks/mercadopago`,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: response.id,
          status: 'PENDING',
          email_address: order.user.email,
        },
      },
    });

    return {
      success: true,
      message: 'Preferencia de pago de Mercado Pago creada',
      initPoint: response.init_point,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a physical POS order in a single transaction
export async function createPosOrder(data: {
  items: CartItem[];
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDni?: string;
  customerAddress?: string;
}) {
  try {
    const session = await requireAdminOrSeller();
    if (!session) throw new Error('Usuario no autorizado');

    const {
      items,
      paymentMethod,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerDni,
      customerAddress,
    } = data;

    if (!items || items.length === 0) {
      throw new Error('El carrito del POS está vacío');
    }

    // Capture seller identity and commission rate
    const sellerId = session?.user?.id ?? null;
    const sellerData = sellerId
      ? await prisma.user.findUnique({
          where: { id: sellerId },
          select: { commissionRate: true },
        })
      : null;

    // 1. Calculate prices
    const itemsPriceVal = items.reduce(
      (acc, item) => acc + Number(item.priceUsed) * item.qty,
      0
    );
    const itemsPrice = round2(itemsPriceVal);
    const shippingPrice = 0;
    const taxPrice = 0;
    const totalPrice = round2(itemsPrice);

    const commissionAmount =
      sellerData?.commissionRate && sellerData.commissionRate > 0
        ? round2(Number(totalPrice) * sellerData.commissionRate)
        : null;

    // 2. Find or create POS customer user
    let customerUser = null;

    if (customerId) {
      customerUser = await prisma.user.findUnique({
        where: { id: customerId },
      });
    }

    if (!customerUser && customerDni && customerDni.trim() !== '') {
      customerUser = await prisma.user.findFirst({
        where: { dni: customerDni.trim() },
      });
    }

    if (!customerUser && customerEmail && customerEmail.trim() !== '') {
      customerUser = await prisma.user.findFirst({
        where: { email: customerEmail.trim().toLowerCase() },
      });
    }

    const defaultEmail = 'consumidorfinal@local.store';
    const emailToUse =
      customerEmail && customerEmail.trim() !== ''
        ? customerEmail.trim().toLowerCase()
        : defaultEmail;
    const nameToUse =
      customerName && customerName.trim() !== ''
        ? customerName.trim()
        : 'Consumidor Final';

    if (!customerUser) {
      // Look up default email user or create a new one
      customerUser = await prisma.user.findFirst({
        where: { email: emailToUse },
      });
      if (!customerUser) {
        customerUser = await prisma.user.create({
          data: {
            name: nameToUse,
            email: emailToUse,
            phone: customerPhone?.trim() || null,
            dni: customerDni?.trim() || null,
            role: 'user',
          },
        });
      }
    }

    // Update user phone or DNI if they were not set
    const userUpdates: { phone?: string; dni?: string } = {};
    if (!customerUser.phone && customerPhone && customerPhone.trim() !== '') {
      userUpdates.phone = customerPhone.trim();
    }
    if (!customerUser.dni && customerDni && customerDni.trim() !== '') {
      // Ensure DNI doesn't conflict
      const existDni = await prisma.user.findUnique({
        where: { dni: customerDni.trim() },
      });
      if (!existDni) {
        userUpdates.dni = customerDni.trim();
      }
    }
    if (Object.keys(userUpdates).length > 0) {
      customerUser = await prisma.user.update({
        where: { id: customerUser.id },
        data: userUpdates,
      });
    }

    const shippingAddress = {
      fullName: customerUser.name,
      streetAddress:
        customerAddress && customerAddress.trim() !== ''
          ? customerAddress.trim()
          : 'Venta en Local',
      city: 'Tucumán',
      province: 'Tucumán',
      postalCode: '4000',
      country: 'Argentina',
      phone: customerUser.phone || customerPhone?.trim() || '00000000',
      contactEmail: customerUser.email,
    };

    // 3. Create the transaction
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      // Create the order
      const insertedOrder = await tx.order.create({
        data: {
          userId: customerUser!.id,
          shippingAddress,
          paymentMethod,
          itemsPrice: itemsPrice.toString(),
          shippingPrice: shippingPrice.toString(),
          taxPrice: taxPrice.toString(),
          totalPrice: totalPrice.toString(),
          isPaid: true,
          paidAt: new Date(),
          isDelivered: true,
          deliveredAt: new Date(),
          shippingStatus: 'Entregado',
          sellerId: sellerId,
          commissionAmount:
            commissionAmount !== null ? commissionAmount : undefined,
        },
      });

      // Create order items and decrement stocks
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: insertedOrder.id,
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            image: item.image,
            qty: item.qty,
            // Fase 2: snapshoteo priceUsed + paymentMethod
            priceUsed: item.priceUsed,
            paymentMethod: item.paymentMethod,
            size: item.size || null,
            productColorId: item.productColorId || null,
            colorName: item.colorName || null,
            colorHex: item.colorHex || null,
          },
        });

        // Decrement stock
        if (item.size || item.productColorId) {
          const variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: item.size ? { name: item.size } : undefined,
              colorId: item.productColorId ?? null,
            },
          });

          if (!variant || variant.stock < item.qty) {
            throw new Error(
              `Stock insuficiente para el producto ${item.name} (talle ${item.size || '—'} / color ${item.colorName || '—'})`
            );
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.qty } },
          });
        }
      }

      return insertedOrder.id;
    });

    if (!insertedOrderId)
      throw new Error('No se pudo procesar la venta en local');

    // Send sale notifications to sellers
    await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { sellerId: true },
        });

        if (product?.sellerId) {
          const seller = await prisma.user.findUnique({
            where: { id: product.sellerId },
            select: { email: true, name: true },
          });

          if (seller?.email) {
            await sendSaleNotification({
              sellerEmail: seller.email,
              sellerName: seller.name || 'Vendedor',
              productName: item.name,
              qty: item.qty,
              price: item.priceUsed,
            });
          }
        }
      })
    );

    return {
      success: true,
      message: 'Venta registrada con éxito',
      orderId: insertedOrderId,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}

// Get abandoned cart metrics for admin dashboard
export async function getAbandonedCartMetrics() {
  try {
    await requireAdmin();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count abandoned carts in the last week
    // Note: Can't filter JSON arrays directly, will count all and filter by items length in app
    const allAbandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          gte: oneWeekAgo,
          lt: oneHourAgo,
        },
        userId: {
          not: null,
        },
      },
      select: {
        items: true,
      },
    });

    const abandonedCartsCount = allAbandonedCarts.filter(
      (cart) => Array.isArray(cart.items) && cart.items.length > 0
    ).length;

    // Count recovery emails sent in the last week
    const recoveryEmailsSent = await prisma.cartRecovery.count({
      where: {
        sentAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Count recovered carts (completed checkout after recovery)
    const recoveredCarts = await prisma.cartRecovery.count({
      where: {
        sentAt: {
          gte: oneWeekAgo,
        },
        recoveredAt: {
          not: null,
        },
      },
    });

    // Calculate recovery rate
    const recoveryRate =
      recoveryEmailsSent > 0
        ? Math.round((recoveredCarts / recoveryEmailsSent) * 100)
        : 0;

    return {
      abandonedCartsCount,
      recoveryEmailsSent,
      recoveredCarts,
      recoveryRate,
    };
  } catch (error) {
    console.error('Error getting abandoned cart metrics:', error);
    return {
      abandonedCartsCount: 0,
      recoveryEmailsSent: 0,
      recoveredCarts: 0,
      recoveryRate: 0,
    };
  }
}
