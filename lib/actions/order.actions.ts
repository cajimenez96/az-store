'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { requireAdmin, requireAdminOrSeller } from '../auth-guard';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertOrderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult, ShippingAddress } from '@/types';
import { paypal } from '../paypal';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { sendPurchaseReceipt, sendNewSaleNotification, sendShippingUpdate } from '@/email';
import { Preference } from 'mercadopago';
import { mpClient } from '../mercadopago';

// Create order and create the order items
export async function createOrder() {
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

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    const expirationHours = process.env.ORDER_EXPIRATION_HOURS
      ? Number(process.env.ORDER_EXPIRATION_HOURS)
      : 24;
    const expiresAt =
      user.paymentMethod === 'TransferenciaBancaria'
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : null;

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
            ...item,
            price: item.price,
            orderId: insertedOrder.id,
          },
        });

        // Decrement stock immediately if Bank Transfer
        if (user.paymentMethod === 'TransferenciaBancaria') {
          if (item.size) {
            const variant = await tx.productVariant.findFirst({
              where: { productId: item.productId, size: { name: item.size } }
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
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
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
        if (item.size) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, size: { name: item.size } }
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

    // Set the order to paid
    await tx.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
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

  const orderData = {
    ...updatedOrder,
    shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
    paymentResult: updatedOrder.paymentResult as PaymentResult,
  };

  sendPurchaseReceipt({
    order: orderData,
  });
  sendNewSaleNotification({
    order: orderData,
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
  const criticalStockThresholdStr = await getSetting('CRITICAL_STOCK_THRESHOLD', '2');
  const criticalStockThreshold = parseInt(criticalStockThresholdStr, 10);

  // Calculate ERP metrics
  const criticalStockCount = await prisma.productVariant.count({
    where: { stock: { lte: criticalStockThreshold } }
  });

  const pendingPaymentsCount = await prisma.order.count({
    where: { isPaid: false }
  });

  const pendingDeliveriesCount = await prisma.order.count({
    where: { isPaid: true, isDelivered: false }
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
}: {
  limit?: number;
  page: number;
  query: string;
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

  const data = await prisma.order.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: { user: { select: { name: true } } },
  });

  const dataCount = await prisma.order.count();

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
        },
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
export async function updateShippingStatus(orderId: string, status: string, notes?: string) {
  try {
    await requireAdminOrSeller();
    
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Orden no encontrada');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingStatus: status,
        shippingNotes: notes || null,
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
        },
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

    if (order.userId !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'seller') {
      throw new Error('No autorizado');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { receiptUrl },
    });

    revalidatePath(`/order/${orderId}`);

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
    const session = await auth();
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'seller') {
      throw new Error('No autorizado');
    }

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
    const session = await auth();
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'seller') {
      throw new Error('No autorizado');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { orderitems: true },
    });

    if (!order) throw new Error('Orden no encontrada');

    if (order.paymentMethod !== 'TransferenciaBancaria') {
      throw new Error('El método de pago no es transferencia bancaria');
    }

    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of order.orderitems) {
        if (item.size) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, size: { name: item.size } }
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

    revalidatePath(`/order/${orderId}`);
    revalidatePath('/admin/orders');

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

    const preference = new Preference(mpClient);
    
    // Prepare items for Mercado Pago
    const items = order.orderitems.map((item) => ({
      id: item.productId,
      title: item.name,
      quantity: item.qty,
      unit_price: Number(item.price),
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

    if (Number(order.taxPrice) > 0) {
      items.push({
        id: 'tax',
        title: 'Impuestos',
        quantity: 1,
        unit_price: Number(order.taxPrice),
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

    // 1. Calculate prices
    const itemsPriceVal = items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0);
    const itemsPrice = round2(itemsPriceVal);
    const shippingPrice = 0;
    const taxPrice = round2(0.15 * itemsPrice);
    const totalPrice = round2(itemsPrice + taxPrice);

    // 2. Find or create POS customer user
    let customerUser = null;

    if (customerId) {
      customerUser = await prisma.user.findUnique({ where: { id: customerId } });
    }

    if (!customerUser && customerDni && customerDni.trim() !== '') {
      customerUser = await prisma.user.findFirst({ where: { dni: customerDni.trim() } });
    }

    if (!customerUser && customerEmail && customerEmail.trim() !== '') {
      customerUser = await prisma.user.findFirst({ where: { email: customerEmail.trim().toLowerCase() } });
    }

    const defaultEmail = 'consumidorfinal@local.store';
    const emailToUse = (customerEmail && customerEmail.trim() !== '') ? customerEmail.trim().toLowerCase() : defaultEmail;
    const nameToUse = (customerName && customerName.trim() !== '') ? customerName.trim() : 'Consumidor Final';

    if (!customerUser) {
      // Look up default email user or create a new one
      customerUser = await prisma.user.findFirst({ where: { email: emailToUse } });
      if (!customerUser) {
        customerUser = await prisma.user.create({
          data: {
            name: nameToUse,
            email: emailToUse,
            phone: customerPhone?.trim() || null,
            dni: customerDni?.trim() || null,
            role: 'user',
          }
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
      const existDni = await prisma.user.findUnique({ where: { dni: customerDni.trim() } });
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
      streetAddress: (customerAddress && customerAddress.trim() !== '') ? customerAddress.trim() : 'Venta en Local',
      city: 'Tucumán',
      province: 'Tucumán',
      postalCode: '4000',
      country: 'Argentina',
      phone: customerUser.phone || customerPhone?.trim() || '00000000',
      contactEmail: customerUser.email
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
        }
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
            price: item.price,
            size: item.size || null,
          }
        });

        // Decrement stock
        if (item.size) {
          const variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: {
                name: item.size
              }
            }
          });

          if (!variant || variant.stock < item.qty) {
            throw new Error(`Stock insuficiente para el producto ${item.name} (${item.size || 'M'})`);
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.qty } }
          });
        }
      }

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error('No se pudo procesar la venta en local');

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
