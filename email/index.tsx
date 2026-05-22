import { Resend } from 'resend';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Order } from '@/types';
import dotenv from 'dotenv';
dotenv.config();

import PurchaseReceiptEmail from './purchase-receipt';
import NewSaleNotificationEmail from './new-sale-notification';
import ShippingUpdateEmail from './shipping-update';
const resend = new Resend(process.env.RESEND_API_KEY as string);

export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: order.user.email,
    subject: `Order Confirmation ${order.id}`,
    react: <PurchaseReceiptEmail order={order} />,
  });
};

export const sendNewSaleNotification = async ({ order }: { order: Order }) => {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: SENDER_EMAIL, // For testing we send it to the admin/seller email registered in Resend
    subject: `¡Nueva Venta! Orden ${order.id}`,
    react: <NewSaleNotificationEmail order={order} />,
  });
};

export const sendShippingUpdate = async ({ order }: { order: Order }) => {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: order.user.email,
    subject: `Actualización de Envío - Orden ${order.id}`,
    react: <ShippingUpdateEmail order={order} />,
  });
};
