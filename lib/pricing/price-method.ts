import type { PaymentMethod as PriceMethod } from '@/lib/constants';

export type { PriceMethod };

export type OrderSource = 'web' | 'pos';

// Which stored price (Price.paymentMethod) each checkout payment method pays.
// Web checkout: bank transfer pays the cash price, MercadoPago the list price.
// POS: cash and transfer pay the cash price; MercadoPago and QR the list price.
const PRICE_METHOD_BY_SOURCE: Record<OrderSource, Record<string, PriceMethod>> = {
  web: {
    TransferenciaBancaria: 'CASH',
    MercadoPago: 'MERCADOPAGO',
  },
  pos: {
    PuntoDeVenta_Efectivo: 'CASH',
    PuntoDeVenta_Transferencia: 'CASH',
    PuntoDeVenta_MercadoPago: 'MERCADOPAGO',
    PuntoDeVenta_QR: 'MERCADOPAGO',
  },
};

export function priceMethodFor(source: OrderSource, method: string): PriceMethod {
  const priceMethod = PRICE_METHOD_BY_SOURCE[source][method];
  if (!priceMethod) {
    throw new Error(`Método de pago no válido: ${method}`);
  }
  return priceMethod;
}
