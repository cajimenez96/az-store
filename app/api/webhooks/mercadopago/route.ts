import { NextRequest, NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Check ID and topic from search parameters (IPN format)
    const topic = searchParams.get('topic');
    let paymentId = searchParams.get('id');

    // 2. Check from request body (Webhooks format)
    if (!paymentId) {
      try {
        const body = await request.json();
        if (body.type === 'payment' || body.action?.startsWith('payment.')) {
          paymentId = body.data?.id || body.id;
        }
      } catch {
        // Body reading failed or was empty, ignore
      }
    }

    // If no paymentId was found, or if topic was sent and it wasn't 'payment', ignore
    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ success: true, message: 'Notification received but not a payment' });
    }

    // 3. Fetch payment info from Mercado Pago
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: Number(paymentId) });

    if (payment && payment.status === 'approved') {
      const orderId = payment.external_reference;
      
      if (!orderId) {
        return NextResponse.json({ success: false, message: 'External reference (order ID) not found in payment' }, { status: 400 });
      }

      const email = payment.payer?.email || '';
      const amount = payment.transaction_amount || 0;

      // Update the order to paid (stock is decremented during updateOrderToPaid for non-bank transfers)
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: String(paymentId),
          status: payment.status,
          email_address: email,
          pricePaid: String(amount),
        },
      });

      return NextResponse.json({ success: true, message: 'Order payment successfully updated' });
    }

    return NextResponse.json({ success: true, message: 'Payment status is not approved' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Mercado Pago webhook error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
