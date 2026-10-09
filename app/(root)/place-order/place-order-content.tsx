'use client';

import { useState, useMemo } from 'react';

import { ShippingAddress } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import PlaceOrderForm from './place-order-form';
import ShippingMethodSelector from './shipping-method-selector';
import CheckoutSteps from '@/components/shared/checkout-steps';
import { MapPin, CreditCard, Package } from 'lucide-react';
import { Cart } from '@/types';
import { ShippingMethodProvider } from '@/hooks/use-shipping-method';
import { paymentOptionTotals, type PriceComparisonInput } from '@/lib/pricing/payment-options';
import { PromoCodeInput } from '@/components/shared/promo-code-input';

type ActiveBanner = {
  id: string;
  title: string;
  discountPercent: number | null;
  products: { id: string }[];
} | null;

// Server-quoted line (price list of the user's payment method), not the cart snapshot.
type QuotedLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  size?: string;
  qty: number;
  priceUsed: string;
};

interface PlaceOrderContentProps {
  cart: Cart;
  quotedLines: QuotedLine[];
  quotedItemsPrice: number;
  quotedTaxPrice: number;
  comparison?: PriceComparisonInput | null;
  userAddress: ShippingAddress;
  userEmail: string;
  paymentMethod: string;
  freeShippingThreshold: number;
  PAYMENT_LABELS: Record<string, string>;
  activeBanner?: ActiveBanner;
}

export default function PlaceOrderContent({
  cart,
  quotedLines,
  quotedItemsPrice,
  quotedTaxPrice,
  comparison = null,
  userAddress,
  userEmail,
  paymentMethod,
  freeShippingThreshold,
  PAYMENT_LABELS,
  activeBanner,
}: PlaceOrderContentProps) {
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState<string>('');

  const bannerDiscount = useMemo(() => {
    if (!activeBanner?.discountPercent || !cart?.items) return 0;
    const bannerProductIds = new Set(activeBanner.products.map((p) => p.id));
    const bannerItemsTotal = quotedLines
      .filter((item) => bannerProductIds.has(item.productId))
      .reduce((sum, item) => sum + Number(item.priceUsed) * item.qty, 0);
    return (bannerItemsTotal * activeBanner.discountPercent) / 100;
  }, [activeBanner, cart, quotedLines]);

  const transferSavings =
    paymentMethod === 'TransferenciaBancaria'
      ? paymentOptionTotals(comparison)?.TransferenciaBancaria.savings
      : null;

  const itemsPrice = quotedItemsPrice;
  const discountAmount = (itemsPrice * appliedDiscount) / 100;
  const shippingPrice = Number(cart.shippingPrice);
  const taxPrice = quotedTaxPrice;
  const finalTotal =
    itemsPrice - discountAmount - bannerDiscount + shippingPrice + taxPrice;

  return (
    <ShippingMethodProvider>
      <div className='w-full'>
        <CheckoutSteps current={3} />

        <h1 className='font-marder-display font-medium text-4xl sm:text-5xl tracking-tight text-nike-ink mb-8'>
          Confirmar Compra
        </h1>

        <div className='grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8'>
          {/* Left column: summary sections */}
          <div className='space-y-5'>
            {/* Shipping address */}
            <div className='bg-white border border-nike-hairline-soft p-6 space-y-3'>
              <div className='flex items-center justify-between pb-3 border-b border-nike-hairline-soft'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-nike-mute' />
                  <h2 className='text-sm font-medium uppercase tracking-wider text-nike-ink'>
                    Dirección de Envío
                  </h2>
                </div>
                <Link href='/shipping-address'>
                  <Button
                    id='edit-shipping'
                    variant='outline'
                    className='rounded-nike-lg border-nike-hairline text-nike-ink text-sm font-medium px-5 h-11 hover:bg-nike-soft-cloud'
                    size='sm'
                  >
                    Editar
                  </Button>
                </Link>
              </div>
              <div className='text-sm text-nike-charcoal space-y-1'>
                <p className='font-semibold text-nike-ink'>
                  {userAddress.fullName}
                </p>
                <p>
                  {userAddress.streetAddress}
                  {userAddress.floor ? `, Piso ${userAddress.floor}` : ''}
                  {userAddress.apartment
                    ? ` Dto. ${userAddress.apartment}`
                    : ''}
                </p>
                <p>
                  {userAddress.city}, {userAddress.province}
                </p>
                <p>
                  CP {userAddress.postalCode} · {userAddress.country}
                </p>
                {userAddress.phone && (
                  <p className='text-nike-mute'>{userAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping method */}
            <ShippingMethodSelector
              itemsPrice={quotedItemsPrice}
              freeShippingThreshold={freeShippingThreshold}
            />

            {/* Payment method */}
            <div className='bg-white border border-nike-hairline-soft p-6 space-y-3'>
              <div className='flex items-center justify-between pb-3 border-b border-nike-hairline-soft'>
                <div className='flex items-center gap-2'>
                  <CreditCard className='w-4 h-4 text-nike-mute' />
                  <h2 className='text-sm font-medium uppercase tracking-wider text-nike-ink'>
                    Método de Pago
                  </h2>
                </div>
                <Link href='/payment-method'>
                  <Button
                    id='edit-payment'
                    variant='outline'
                    className='rounded-nike-lg border-nike-hairline text-nike-ink text-sm font-medium px-5 h-11 hover:bg-nike-soft-cloud'
                    size='sm'
                  >
                    Editar
                  </Button>
                </Link>
              </div>
              <p className='text-sm font-medium text-nike-ink'>
                {PAYMENT_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>

            {/* Order items */}
            <div className='bg-white border border-nike-hairline-soft p-6 space-y-3'>
              <div className='flex items-center gap-2 pb-3 border-b border-nike-hairline-soft'>
                <Package className='w-4 h-4 text-nike-mute' />
                <h2 className='text-sm font-medium uppercase tracking-wider text-nike-ink'>
                  Artículos ({cart.items.length})
                </h2>
              </div>

              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-nike-hairline-soft'>
                      <TableHead className='text-xs uppercase font-semibold text-nike-mute pl-0'>
                        Producto
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-nike-mute text-center w-20'>
                        Cantidad
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-nike-mute text-right h-10 pr-0'>
                        Precio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotedLines.map((item) => (
                      <TableRow
                        key={`${item.slug}-${item.size || ''}`}
                        className='border-b border-nike-hairline-soft last:border-0 '
                      >
                        <TableCell className='py-3 pl-0'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 group'
                          >
                            <div className='w-12 h-12 bg-nike-soft-cloud p-1 flex-shrink-0 flex items-center justify-center'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={44}
                                height={44}
                                className='object-contain'
                              />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                              <span className='text-sm font-medium text-nike-ink group-hover:underline transition duration-150'>
                                {item.name}
                              </span>
                              {item.size && (
                                <span className='text-xs text-nike-mute'>
                                  Talle: {item.size}
                                </span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='py-3 text-center text-sm font-semibold text-nike-ink tabular-nums'>
                          {item.qty}
                        </TableCell>
                        <TableCell className='py-3 text-right text-sm font-semibold text-nike-ink tabular-nums pr-0'>
                          {formatCurrency(item.priceUsed)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right column: order summary + CTA */}
          <div className='lg:sticky lg:top-24 h-fit'>
            <div className='bg-nike-soft-cloud p-6 flex flex-col gap-5'>
              <h2 className='text-sm font-medium uppercase tracking-wider text-nike-ink border-b border-nike-hairline-soft pb-4'>
                Resumen del Pedido
              </h2>

              <div className='space-y-3'>
                <p className='text-xs text-nike-mute'>
                  Precios según: {PAYMENT_LABELS[paymentMethod] || paymentMethod}
                </p>
                <div className='flex justify-between text-sm text-nike-mute'>
                  <span>Productos</span>
                  <span className='font-semibold text-nike-ink tabular-nums'>
                    {formatCurrency(quotedItemsPrice)}
                  </span>
                </div>
                <div className='flex justify-between text-sm text-nike-mute'>
                  <span>Envío</span>
                  <span className='font-semibold text-nike-ink tabular-nums'>
                    {Number(cart.shippingPrice) === 0
                      ? 'Gratis'
                      : formatCurrency(cart.shippingPrice)}
                  </span>
                </div>
                {transferSavings && (
                  <p
                    id='place-order-transfer-savings'
                    className='bg-white text-nike-success text-sm font-medium rounded-nike-sm px-4 py-3'
                  >
                    Estás ahorrando{' '}
                    <span className='tabular-nums'>{formatCurrency(transferSavings.amount)}</span> (
                    {transferSavings.percent} %) por pagar con transferencia
                  </p>
                )}
                {discountAmount > 0 && (
                  <div className='flex justify-between text-sm text-nike-success font-medium'>
                    <span>
                      Descuento ({appliedPromoCode}
                      {appliedPaymentMethod
                        ? ` — ${appliedDiscount}%`
                        : ` — ${appliedDiscount}%`}
                      )
                    </span>
                    <span className='font-semibold tabular-nums'>
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {bannerDiscount > 0 && (
                  <div className='flex justify-between text-sm text-nike-success font-medium'>
                    <span>
                      Descuento banner ({activeBanner?.discountPercent}%)
                    </span>
                    <span className='font-semibold tabular-nums'>
                      -{formatCurrency(bannerDiscount)}
                    </span>
                  </div>
                )}
                <div className='border-t border-nike-hairline-soft pt-4 flex justify-between items-baseline'>
                  <span className='font-medium text-base text-nike-ink'>
                    Total
                  </span>
                  <span className='text-2xl font-medium tracking-tight text-nike-ink tabular-nums'>
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <div className='border-t border-nike-hairline-soft pt-4'>
                <PromoCodeInput
                  appliedCode={appliedPromoCode}
                  appliedDiscount={appliedDiscount}
                  appliedPaymentMethod={appliedPaymentMethod}
                  onPromoApplied={(code, discount, appliedMethod) => {
                    setAppliedPromoCode(code);
                    setAppliedDiscount(discount);
                    setAppliedPaymentMethod(appliedMethod);
                  }}
                  onPromoRemoved={() => {
                    setAppliedPromoCode('');
                    setAppliedDiscount(0);
                    setAppliedPaymentMethod('');
                  }}
                />
              </div>

              <PlaceOrderForm
                promoCode={appliedPromoCode}
                bannerId={activeBanner?.id}
                bannerDiscount={bannerDiscount > 0 ? bannerDiscount : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </ShippingMethodProvider>
  );
}
