import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

function verifyMPSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of xSignature.split(',')) {
    const [key, value] = part.trim().split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) return false;

  const message = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = createHmac('sha256', secret).update(message).digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(v1, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { success: false, message: 'MERCADOPAGO_WEBHOOK_SECRET no está configurado en el entorno' },
        { status: 500 }
      );
    }

    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      return NextResponse.json(
        { success: false, message: 'Firma no proporcionada' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    let paymentId = searchParams.get('id');
    let dataId = paymentId; // IPN format: query param id es el dataId

    // Webhook format: leer body para obtener dataId y paymentId
    if (!paymentId) {
      try {
        const body = await request.json();
        if (body?.type === 'payment' || body?.action?.startsWith('payment.')) {
          dataId = body.data?.id ? String(body.data.id) : null;
          paymentId = dataId ?? (body.id ? String(body.id) : null);
        }
      } catch {
        // Body vacío o inválido, continuar sin él
      }
    }

    if (!verifyMPSignature(xSignature, xRequestId, dataId ?? '', webhookSecret)) {
      return NextResponse.json(
        { success: false, message: 'Firma inválida' },
        { status: 401 }
      );
    }

    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ success: true, message: 'Notification received but not a payment' });
    }

    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: Number(paymentId) });

    if (payment && payment.status === 'approved') {
      const orderId = payment.external_reference;

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: 'External reference (order ID) not found in payment' },
          { status: 400 }
        );
      }

      const email = payment.payer?.email || '';
      const amount = payment.transaction_amount || 0;

      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: String(paymentId),
          status: payment.status,
          email_address: email,
          pricePaid: String(amount),
        },
        mpPaymentId: String(paymentId),
      });

      return NextResponse.json({ success: true, message: 'Order payment successfully updated' });
    }

    return NextResponse.json({ success: true, message: 'Payment status is not approved' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Mercado Pago webhook error:', error);

    // Idempotencia: si la orden ya estaba pagada, MP no debe reintentar
    if (message.includes('La orden ya está pagada')) {
      return NextResponse.json({ success: true, message: 'Order already paid' });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
