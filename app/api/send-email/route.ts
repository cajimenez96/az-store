import { Resend } from 'resend';
import {
  passwordResetTemplate,
  orderConfirmationTemplate,
  receiptUploadedTemplate,
  transferApprovedTemplate,
  transferRejectedTemplate,
  shippingUpdateTemplate,
} from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let subject = '';
    let html = '';
    let recipientEmail = '';

    switch (type) {
      case 'password-reset':
        subject = 'Restablecer tu contraseña';
        html = passwordResetTemplate(data.email, data.resetLink);
        recipientEmail = data.email;
        break;

      case 'order-confirmation':
        subject =
          data.paymentMethod === 'TransferenciaBancaria'
            ? `Orden confirmada #${data.orderId} - Datos bancarios incluidos`
            : `Orden confirmada #${data.orderId}`;
        html = orderConfirmationTemplate(
          data.orderId,
          data.customerName,
          data.items,
          data.itemsPrice,
          data.shippingPrice,
          data.taxPrice,
          data.totalPrice,
          data.paymentMethod,
          data.bankInfo
        );
        recipientEmail = data.email;
        break;

      case 'receipt-uploaded':
        subject = `Comprobante de transferencia subido - Orden #${data.orderId}`;
        html = receiptUploadedTemplate(
          data.orderId,
          data.customerName,
          data.amount
        );
        recipientEmail = data.adminEmail || SENDER_EMAIL;
        break;

      case 'transfer-approved':
        subject = `¡Transferencia aprobada! Orden #${data.orderId}`;
        html = transferApprovedTemplate(
          data.orderId,
          data.customerName,
          data.amount
        );
        recipientEmail = data.email;
        break;

      case 'transfer-rejected':
        subject = `Transferencia rechazada - Orden #${data.orderId}`;
        html = transferRejectedTemplate(
          data.orderId,
          data.customerName,
          data.amount,
          data.reason
        );
        recipientEmail = data.email;
        break;

      case 'shipping-update':
        subject =
          data.status === 'Entregado'
            ? `¡Tu orden ha llegado! #${data.orderId}`
            : `Tu orden está en camino - #${data.orderId}`;
        html = shippingUpdateTemplate(
          data.orderId,
          data.customerName,
          data.status,
          data.trackingNumber,
          data.estimatedDelivery
        );
        recipientEmail = data.email;
        break;

      default:
        return Response.json(
          { error: 'Unknown email type' },
          { status: 400 }
        );
    }

    if (!html || !subject || !recipientEmail) {
      return Response.json(
        { error: 'Missing email template, subject, or recipient' },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: recipientEmail,
      subject,
      html,
    });

    if (result.error) {
      console.error(`Email send error (${type}):`, result.error);
      return Response.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Send email API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
