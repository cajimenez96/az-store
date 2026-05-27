/**
 * Email integration layer
 * Handles sending all transactional emails via /api/send-email endpoint
 */

import { CartItem, ShippingAddress } from '@/types';
import { Order, OrderItem } from '@prisma/client';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

interface OrderWithDetails {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  totalPrice: string | number;
  itemsPrice: string | number;
  shippingPrice: string | number;
  taxPrice: string | number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  shippingStatus: string | null;
  paymentResult?: Record<string, any>;
  orderitems: Array<{
    name: string;
    size?: string | null;
    qty: number;
    price: string | number;
  }>;
}

/**
 * Send order confirmation email
 * E1 (TB) + E6 (MP) - sent when order is created
 */
export async function sendPurchaseReceipt({
  order,
  bankInfo,
}: {
  order: OrderWithDetails;
  bankInfo?: {
    bank: string;
    accountHolder: string;
    cbu: string;
    alias: string;
    cuit: string;
  };
}) {
  if (!order.user?.email) return;

  const items = order.orderitems.map((item) => ({
    name: item.name,
    size: item.size,
    qty: item.qty,
    price: String(item.price),
  }));

  try {
    await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order-confirmation',
        email: order.user.email,
        orderId: order.id,
        customerName: order.user.name,
        items,
        itemsPrice: String(order.itemsPrice),
        shippingPrice: String(order.shippingPrice),
        taxPrice: String(order.taxPrice),
        totalPrice: String(order.totalPrice),
        paymentMethod: order.paymentMethod,
        bankInfo,
      }),
    });
  } catch (error) {
    console.error('Failed to send purchase receipt:', error);
  }
}

/**
 * Send receipt uploaded notification to admin
 * E2 - sent when customer uploads transfer receipt
 */
export async function sendNewSaleNotification({
  order,
}: {
  order: OrderWithDetails;
}) {
  if (!order.user?.email) return;

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@azstore.com';

    await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'receipt-uploaded',
        adminEmail,
        orderId: order.id,
        customerName: order.user.name,
        amount: String(order.totalPrice),
      }),
    });
  } catch (error) {
    console.error('Failed to send receipt uploaded notification:', error);
  }
}

/**
 * Send transfer approved email to customer
 * E3 - sent when admin approves bank transfer
 */
export async function sendTransferApproved({
  order,
}: {
  order: OrderWithDetails;
}) {
  if (!order.user?.email) return;

  try {
    await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transfer-approved',
        email: order.user.email,
        orderId: order.id,
        customerName: order.user.name,
        amount: String(order.totalPrice),
      }),
    });
  } catch (error) {
    console.error('Failed to send transfer approved email:', error);
  }
}

/**
 * Send transfer rejected email to customer
 * E4 - sent when admin rejects bank transfer
 */
export async function sendTransferRejected({
  order,
  reason,
}: {
  order: OrderWithDetails;
  reason?: string;
}) {
  if (!order.user?.email) return;

  try {
    await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transfer-rejected',
        email: order.user.email,
        orderId: order.id,
        customerName: order.user.name,
        amount: String(order.totalPrice),
        reason,
      }),
    });
  } catch (error) {
    console.error('Failed to send transfer rejected email:', error);
  }
}

/**
 * Send shipping update email to customer
 * E7 - sent when order status changes (Enviado, En tránsito, Entregado)
 */
export async function sendShippingUpdate({
  order,
  trackingNumber,
  estimatedDelivery,
}: {
  order: OrderWithDetails;
  trackingNumber?: string;
  estimatedDelivery?: string;
}) {
  if (!order.user?.email) return;

  try {
    await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'shipping-update',
        email: order.user.email,
        orderId: order.id,
        customerName: order.user.name,
        status: order.shippingStatus || 'Enviado',
        trackingNumber,
        estimatedDelivery,
      }),
    });
  } catch (error) {
    console.error('Failed to send shipping update email:', error);
  }
}
