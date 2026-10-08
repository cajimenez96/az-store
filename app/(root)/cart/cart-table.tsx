'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { ArrowRight, Loader, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Cart, CartItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

function QtyButton({
  item,
  action,
}: {
  item: CartItem;
  action: 'add' | 'remove';
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () =>
    startTransition(async () => {
      const res =
        action === 'add'
          ? await addItemToCart({
              productId: item.productId,
              size: item.size,
              productColorId: item.productColorId,
            })
          : await removeItemFromCart(
              item.productId,
              item.size,
              item.productColorId
            );

      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      }
    });

  return (
    <button
      disabled={isPending}
      onClick={handleClick}
      className='h-8 w-8 rounded-full bg-nike-soft-cloud flex items-center justify-center text-nike-ink hover:bg-nike-ink hover:text-white transition-all active:scale-90 disabled:opacity-40'
      aria-label={action === 'add' ? 'Agregar uno' : 'Quitar uno'}
    >
      {isPending ? (
        <Loader className='w-3.5 h-3.5 animate-spin' />
      ) : action === 'add' ? (
        <Plus className='w-3.5 h-3.5' />
      ) : (
        <Minus className='w-3.5 h-3.5' />
      )}
    </button>
  );
}

const CartTable = ({ cart }: { cart?: Cart }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!cart || cart.items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24 text-center'>
        <div className='w-20 h-20 rounded-full bg-nike-soft-cloud flex items-center justify-center mb-6'>
          <ShoppingBag className='w-9 h-9 text-nike-mute' />
        </div>
        <h1 className='font-marder-display text-3xl sm:text-4xl font-bold text-nike-ink mb-2'>Tu carrito está vacío</h1>
        <p className='font-sans text-sm sm:text-base text-nike-mute mb-8'>
          Explorá nuestro catálogo y encontrá lo que buscás.
        </p>
        <Link
          href='/'
          id='cart-empty-cta'
          className='inline-flex items-center justify-center bg-nike-ink text-white font-sans text-sm sm:text-base font-medium px-8 py-3.5 rounded-full hover:bg-black/85 active:scale-95 transition-all shadow-sm'
        >
          Ir a comprar
        </Link>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <h1 className='font-marder-display text-3xl sm:text-4xl lg:text-5xl font-bold text-nike-ink mb-8'>
        Carrito de Compras
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start'>
        {/* Items table */}
        <div className='bg-white border border-nike-hairline-soft overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-nike-hairline-soft hover:bg-transparent bg-nike-soft-cloud/50'>
                <TableHead className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest h-12 pl-6'>Producto</TableHead>
                <TableHead className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest text-center h-12'>Cantidad</TableHead>
                <TableHead className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest text-right h-12 pr-6'>Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow
                  key={`${item.slug}-${item.size || ''}-${item.productColorId || ''}`}
                  className='border-b border-nike-hairline-soft last:border-0 hover:bg-nike-soft-cloud/30 transition-colors'
                >
                  <TableCell className='py-5 pl-6'>
                    <Link
                      href={`/product/${item.slug}`}
                      className='flex items-center gap-4 group'
                    >
                      <div className='w-16 h-16 sm:w-20 sm:h-20 bg-nike-soft-cloud flex items-center justify-center flex-shrink-0'>
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className='object-contain p-1 group-hover:scale-105 transition-transform duration-200'
                        />
                      </div>
                      <div className='flex flex-col gap-1'>
                        <span className='font-sans text-sm sm:text-base font-medium text-nike-ink group-hover:opacity-75 transition-opacity line-clamp-1'>
                          {item.name}
                        </span>
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 font-sans text-xs text-nike-mute'>
                          {item.size && <span>Talle: <span className='text-nike-ink font-medium'>{item.size}</span></span>}
                          {item.colorName && (
                            <span className='flex items-center gap-1.5'>
                              <span
                                className='inline-block w-2.5 h-2.5 rounded-full border border-nike-hairline'
                                style={{ backgroundColor: item.colorHex || '#cccccc' }}
                                aria-hidden
                              />
                              {item.colorName}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className='py-5 text-center'>
                    <div className='flex items-center justify-center gap-2.5'>
                      <QtyButton item={item} action='remove' />
                      <span className='w-6 text-center font-sans text-sm font-semibold text-nike-ink tabular-nums'>
                        {item.qty}
                      </span>
                      <QtyButton item={item} action='add' />
                    </div>
                  </TableCell>
                  <TableCell className='py-5 text-right font-sans text-sm sm:text-base font-semibold text-nike-ink pr-6 tabular-nums'>
                    {formatCurrency(item.priceUsed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order summary rail */}
        <div className='lg:sticky lg:top-24 h-fit'>
          <div className='bg-nike-soft-cloud/60 border border-nike-hairline-soft p-6 sm:p-8 flex flex-col gap-6'>
            <h2 className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest'>
              Resumen de compra
            </h2>

            <div className='space-y-3.5'>
              <div className='flex justify-between font-sans text-sm text-nike-charcoal'>
                <span>Subtotal ({cart.items.reduce((a, c) => a + c.qty, 0)} items)</span>
                <span className='font-medium text-nike-ink tabular-nums'>
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>
              <div className='border-t border-nike-hairline-soft pt-3.5 flex justify-between items-baseline'>
                <span className='font-sans text-base font-bold text-nike-ink'>Total estimado</span>
                <span className='font-sans text-xl sm:text-2xl font-bold text-nike-ink tabular-nums'>
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>
            </div>

            <button
              id='cart-checkout-cta'
              className='w-full inline-flex items-center justify-center gap-2 bg-nike-ink hover:bg-black text-white py-4 px-8 rounded-full font-sans text-sm sm:text-base font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50'
              disabled={isPending}
              onClick={() => startTransition(() => router.push('/shipping-address'))}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  Continuar Compra
                  <ArrowRight className='w-4 h-4' />
                </>
              )}
            </button>

            <Link href='/' className='text-center font-sans text-xs sm:text-sm font-medium text-nike-mute hover:text-nike-ink transition-colors'>
              ← Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartTable;
