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
          ? await addItemToCart(item)
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
      className='h-8 w-8 rounded-az-full border border-az-hairline-soft flex items-center justify-center text-az-ink hover:bg-az-ink-deep hover:text-white hover:border-az-ink-deep transition-colors duration-150 disabled:opacity-40'
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
        <div className='w-20 h-20 rounded-az-xxxl bg-az-surface-soft flex items-center justify-center mb-6'>
          <ShoppingBag className='w-9 h-9 text-az-stone' />
        </div>
        <h1 className='az-heading-md text-az-ink-deep mb-2'>Tu carrito está vacío</h1>
        <p className='az-body-md text-az-steel mb-8'>
          Explorá nuestro catálogo y encontrá lo que buscás.
        </p>
        <Link href='/'>
          <Button variant='buyCta' size='lg' id='cart-empty-cta'>
            Ir a comprar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <h1 className='az-heading-lg text-az-ink-deep mb-8'>Carrito de Compras</h1>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8'>
        {/* Items table */}
        <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-az-hairline-soft hover:bg-transparent'>
                <TableHead className='az-body-sm-bold text-az-ink h-12 pl-6'>Producto</TableHead>
                <TableHead className='az-body-sm-bold text-az-ink text-center h-12'>Cantidad</TableHead>
                <TableHead className='az-body-sm-bold text-az-ink text-right h-12 pr-6'>Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow
                  key={`${item.slug}-${item.size || ''}-${item.productColorId || ''}`}
                  className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors duration-150'
                >
                  <TableCell className='py-5 pl-6'>
                    <Link
                      href={`/product/${item.slug}`}
                      className='flex items-center gap-4 group'
                    >
                      <div className='rounded-az-xl border border-az-hairline-soft bg-az-surface-soft p-1.5 flex-shrink-0'>
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          className='object-contain rounded-az-lg'
                        />
                      </div>
                      <div className='flex flex-col gap-0.5'>
                        <span className='az-body-md-bold text-az-ink-deep group-hover:underline transition duration-150'>
                          {item.name}
                        </span>
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 az-caption text-az-steel'>
                          {item.size && <span>Talle: {item.size}</span>}
                          {item.colorName && (
                            <span className='flex items-center gap-1.5'>
                              <span
                                className='inline-block w-3 h-3 rounded-full border border-az-hairline'
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
                    <div className='flex items-center justify-center gap-3'>
                      <QtyButton item={item} action='remove' />
                      <span className='w-6 text-center az-body-md-bold text-az-ink-deep tabular-nums'>
                        {item.qty}
                      </span>
                      <QtyButton item={item} action='add' />
                    </div>
                  </TableCell>
                  <TableCell className='py-5 text-right az-body-md-bold text-az-ink-deep pr-6 tabular-nums'>
                    {formatCurrency(item.priceUsed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order summary rail */}
        <div className='lg:sticky lg:top-24 h-fit'>
          <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px] p-6 flex flex-col gap-5'>
            <p className='az-caption-bold text-az-steel uppercase tracking-wider'>
              Resumen de compra
            </p>

            <div className='space-y-3'>
              <div className='flex justify-between az-body-sm text-az-charcoal'>
                <span>Subtotal ({cart.items.reduce((a, c) => a + c.qty, 0)} items)</span>
                <span className='az-body-sm-bold text-az-ink-deep tabular-nums'>
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>
              <div className='border-t border-az-hairline-soft pt-3 flex justify-between'>
                <span className='az-body-md-bold text-az-ink-deep'>Total</span>
                <span className='az-heading-sm text-az-ink-deep tabular-nums'>
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>
            </div>

            <Button
              id='cart-checkout-cta'
              className='w-full'
              variant='buyCta'
              size='lg'
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
            </Button>

            <Link href='/' className='text-center az-body-sm text-az-steel hover:text-az-ink transition-colors'>
              ← Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartTable;
