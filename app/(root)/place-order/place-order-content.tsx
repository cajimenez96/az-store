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

        <h1 className='font-marder-display font-medium text-4xl sm:text-5xl tracking-tight text-nike-ink mb-8'>
          Confirmar Compra
        </h1>

        <div className='grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8'>
          {/* Left column: summary sections */}
          <div className='space-y-5'>
            {/* Shipping address */}
            <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-3 shadow-sm'>
              <div className='flex items-center justify-between pb-3 border-b border-[#e5e5e5]'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-[#757575]' />
                  <h2 className='text-sm font-bold uppercase tracking-wider text-nike-ink'>
                    Dirección de Envío
                  </h2>
                </div>
                <Link href='/shipping-address'>
                  <Button
                    id='edit-shipping'
                    variant='outline'
                    className='rounded-full border-[#cacacb] text-nike-ink text-xs font-semibold px-4 h-8 hover:bg-[#f5f5f5]'
                    size='sm'
                  >
                    Editar
                  </Button>
                </Link>
              </div>
              <div className='text-sm text-[#484848] space-y-1'>
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
                  <p className='text-[#757575]'>{userAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping method */}
            <ShippingMethodSelector
              itemsPrice={cart.itemsPrice}
              freeShippingThreshold={freeShippingThreshold}
            />

            {/* Payment method */}
            <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-3 shadow-sm'>
              <div className='flex items-center justify-between pb-3 border-b border-[#e5e5e5]'>
                <div className='flex items-center gap-2'>
                  <CreditCard className='w-4 h-4 text-[#757575]' />
                  <h2 className='text-sm font-bold uppercase tracking-wider text-nike-ink'>
                    Método de Pago
                  </h2>
                </div>
                <Link href='/payment-method'>
                  <Button
                    id='edit-payment'
                    variant='outline'
                    className='rounded-full border-[#cacacb] text-nike-ink text-xs font-semibold px-4 h-8 hover:bg-[#f5f5f5]'
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
            <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-3 shadow-sm'>
              <div className='flex items-center gap-2 pb-3 border-b border-[#e5e5e5]'>
                <Package className='w-4 h-4 text-[#757575]' />
                <h2 className='text-sm font-bold uppercase tracking-wider text-nike-ink'>
                  Artículos ({cart.items.length})
                </h2>
              </div>

              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-[#e5e5e5]'>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] pl-0'>
                        Producto
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] text-center w-20'>
                        Cantidad
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] text-right h-10 pr-0'>
                        Precio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow
                        key={`${item.slug}-${item.size || ''}`}
                        className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors duration-150'
                      >
                        <TableCell className='py-3 pl-0'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 group'
                          >
                            <div className='w-12 h-12 rounded-lg bg-[#f5f5f5] p-1 flex-shrink-0 flex items-center justify-center'>
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
                                <span className='text-xs text-[#757575]'>
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
            <div className='bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-6 flex flex-col gap-5'>
              <h2 className='text-sm font-bold uppercase tracking-wider text-nike-ink border-b border-[#e5e5e5] pb-4'>
                Resumen del Pedido
              </h2>

              <div className='space-y-3'>
                <div className='flex justify-between text-sm text-[#757575]'>
                  <span>Productos</span>
                  <span className='font-semibold text-nike-ink tabular-nums'>
                    {formatCurrency(cart.itemsPrice)}
                  </span>
                </div>
                <div className='flex justify-between text-sm text-[#757575]'>
                  <span>Envío</span>
                  <span className='font-semibold text-nike-ink tabular-nums'>
                    {Number(cart.shippingPrice) === 0
                      ? 'Gratis'
                      : formatCurrency(cart.shippingPrice)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className='flex justify-between text-sm text-green-700 font-medium'>
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
                  <div className='flex justify-between text-sm text-green-700 font-medium'>
                    <span>
                      Descuento banner ({activeBanner?.discountPercent}%)
                    </span>
                    <span className='font-semibold tabular-nums'>
                      -{formatCurrency(bannerDiscount)}
                    </span>
                  </div>
                )}
                <div className='border-t border-[#e5e5e5] pt-4 flex justify-between items-baseline'>
                  <span className='font-bold text-base text-nike-ink'>
                    Total
                  </span>
                  <span className='text-2xl font-bold tracking-tight text-nike-ink tabular-nums'>
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <div className='border-t border-[#e5e5e5] pt-4'>
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
