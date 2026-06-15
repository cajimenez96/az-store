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
import { PromoCodeInput } from '@/components/shared/promo-code-input';

type ActiveBanner = {
  id: string;
  title: string;
  discountPercent: number | null;
  products: { id: string }[];
} | null;

interface PlaceOrderContentProps {
  cart: Cart;
  userAddress: ShippingAddress;
  userEmail: string;
  paymentMethod: string;
  freeShippingThreshold: number;
  PAYMENT_LABELS: Record<string, string>;
  activeBanner?: ActiveBanner;
}

export default function PlaceOrderContent({
  cart,
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
    const bannerItemsTotal = cart.items
      .filter((item) => bannerProductIds.has(item.productId))
      .reduce((sum, item) => sum + Number(item.priceUsed) * item.qty, 0);
    return (bannerItemsTotal * activeBanner.discountPercent) / 100;
  }, [activeBanner, cart]);

  const itemsPrice = Number(cart.itemsPrice);
  const discountAmount = (itemsPrice * appliedDiscount) / 100;
  const shippingPrice = Number(cart.shippingPrice);
  const taxPrice = Number(cart.taxPrice);
  const finalTotal =
    itemsPrice - discountAmount - bannerDiscount + shippingPrice + taxPrice;

  return (
    <ShippingMethodProvider>
      <div className='w-full'>
        <CheckoutSteps current={3} />

        <h1 className='az-heading-lg text-az-ink-deep mb-8'>
          Confirmar Compra
        </h1>

        <div className='grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8'>
          {/* Left column: summary sections */}
          <div className='space-y-4'>
            {/* Shipping address */}
            <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 space-y-3'>
              <div className='flex items-center justify-between pb-3 border-b border-az-hairline-soft'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-az-steel' />
                  <h2 className='az-body-md-bold text-az-ink-deep'>
                    Dirección de Envío
                  </h2>
                </div>
                <Link href='/shipping-address'>
                  <Button
                    id='edit-shipping'
                    variant='outlineLight'
                    className='border border-az-ink-button/20'
                    size='sm'
                  >
                    Editar
                  </Button>
                </Link>
              </div>
              <div className='az-body-sm text-az-charcoal space-y-1'>
                <p className='az-body-sm-bold text-az-ink-deep'>
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
                  <p className='text-az-steel'>{userAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping method */}
            <ShippingMethodSelector
              itemsPrice={cart.itemsPrice}
              freeShippingThreshold={freeShippingThreshold}
            />

            {/* Payment method */}
            <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 space-y-3'>
              <div className='flex items-center justify-between pb-3 border-b border-az-hairline-soft'>
                <div className='flex items-center gap-2'>
                  <CreditCard className='w-4 h-4 text-az-steel' />
                  <h2 className='az-body-md-bold text-az-ink-deep'>
                    Método de Pago
                  </h2>
                </div>
                <Link href='/payment-method'>
                  <Button
                    id='edit-payment'
                    variant='outlineLight'
                    className='border border-az-ink-button/20'
                    size='sm'
                  >
                    Editar
                  </Button>
                </Link>
              </div>
              <p className='az-body-sm text-az-charcoal'>
                {PAYMENT_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>

            {/* Order items */}
            <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 space-y-3'>
              <div className='flex items-center gap-2 pb-3 border-b border-az-hairline-soft'>
                <Package className='w-4 h-4 text-az-steel' />
                <h2 className='az-body-md-bold text-az-ink-deep'>
                  Artículos ({cart.items.length})
                </h2>
              </div>

              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='az-body-sm-bold text-az-ink pl-0'>
                        Producto
                      </TableHead>
                      <TableHead className='az-body-sm-bold text-az-ink text-center w-20'>
                        Cantidad
                      </TableHead>
                      <TableHead className='az-body-sm-bold text-az-ink text-right h-10 pr-0'>
                        Precio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow
                        key={`${item.slug}-${item.size || ''}`}
                        className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors duration-150'
                      >
                        <TableCell className='py-3 pl-0'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 group'
                          >
                            <div className='rounded-az-xl border border-az-hairline-soft bg-az-surface-soft p-1.5 flex-shrink-0'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className='object-contain rounded-az-lg'
                              />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                              <span className='az-body-sm-bold text-az-ink-deep group-hover:underline transition duration-150'>
                                {item.name}
                              </span>
                              {item.size && (
                                <span className='az-caption text-az-steel'>
                                  Talle: {item.size}
                                </span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='py-3 text-center az-body-sm-bold text-az-ink-deep tabular-nums'>
                          {item.qty}
                        </TableCell>
                        <TableCell className='py-3 text-right az-body-sm-bold text-az-ink-deep tabular-nums pr-0'>
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
            <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px] p-6 flex flex-col gap-5'>
              <h2 className='az-body-md-bold text-az-ink-deep border-b border-az-hairline-soft pb-4'>
                Resumen del Pedido
              </h2>

              <div className='space-y-3'>
                <div className='flex justify-between az-body-sm text-az-charcoal'>
                  <span>Productos</span>
                  <span className='az-body-sm-bold text-az-ink-deep tabular-nums'>
                    {formatCurrency(cart.itemsPrice)}
                  </span>
                </div>
                {/* {Number(cart.taxPrice) > 0 && (
                  <div className='flex justify-between az-body-sm text-az-charcoal'>
                    <span>Impuestos</span>
                    <span className='az-body-sm-bold text-az-ink-deep tabular-nums'>
                      {formatCurrency(cart.taxPrice)}
                    </span>
                  </div>
                )} */}
                <div className='flex justify-between az-body-sm text-az-charcoal'>
                  <span>Envío</span>
                  <span className='az-body-sm-bold text-az-ink-deep tabular-nums'>
                    {Number(cart.shippingPrice) === 0
                      ? 'Gratis'
                      : formatCurrency(cart.shippingPrice)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className='flex justify-between az-body-sm text-green-600'>
                    <span>
                      Descuento ({appliedPromoCode}
                      {appliedPaymentMethod
                        ? ` — ${appliedDiscount}% con ${PAYMENT_LABELS[appliedPaymentMethod] || appliedPaymentMethod}`
                        : ` — ${appliedDiscount}%`}
                      )
                    </span>
                    <span className='az-body-sm-bold tabular-nums'>
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {bannerDiscount > 0 && (
                  <div className='flex justify-between az-body-sm text-green-600'>
                    <span>
                      Descuento banner ({activeBanner?.discountPercent}%)
                    </span>
                    <span className='az-body-sm-bold tabular-nums'>
                      -{formatCurrency(bannerDiscount)}
                    </span>
                  </div>
                )}
                <div className='border-t border-az-hairline-soft pt-3 flex justify-between'>
                  <span className='az-body-md-bold text-az-ink-deep'>
                    Total
                  </span>
                  <span className='az-heading-sm text-az-ink-deep tabular-nums'>
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <div className='border-t border-az-hairline-soft pt-4'>
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
