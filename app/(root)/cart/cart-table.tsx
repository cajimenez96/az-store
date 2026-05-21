'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { ArrowRight, Loader, Minus, Plus } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

function AddButton({ item }: { item: CartItem }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={isPending}
      variant='outline'
      type='button'
      className='rounded-full h-8 w-8 p-0 flex items-center justify-center border-hairline-light hover:bg-black hover:text-white hover:border-transparent transition-all duration-200'
      onClick={() =>
        startTransition(async () => {
          const res = await addItemToCart(item);

          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            });
          }
        })
      }
    >
      {isPending ? (
        <Loader className='w-4 h-4 animate-spin' />
      ) : (
        <Plus className='w-3 h-3' />
      )}
    </Button>
  );
}

function RemoveButton({ item }: { item: CartItem }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={isPending}
      variant='outline'
      type='button'
      className='rounded-full h-8 w-8 p-0 flex items-center justify-center border-hairline-light hover:bg-black hover:text-white hover:border-transparent transition-all duration-200'
      onClick={() =>
        startTransition(async () => {
          const res = await removeItemFromCart(item.productId);

          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            });
          }
        })
      }
    >
      {isPending ? (
        <Loader className='w-4 h-4 animate-spin' />
      ) : (
        <Minus className='w-3 h-3' />
      )}
    </Button>
  );
}

const CartTable = ({ cart }: { cart?: Cart }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className='w-full max-w-7xl mx-auto px-4 py-8 bg-canvas-cream rounded-xl min-h-[60vh]'>
      <h1 className='font-display font-[330] text-3xl md:text-4xl text-black font-ss03 mb-8 px-2'>
        Carrito de Compras
      </h1>
      {!cart || cart.items.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-level-3 border-0 p-8'>
          <p className='text-zinc-500 mb-6 font-medium'>Tu carrito de compras está vacío.</p>
          <Link href='/' className='inline-flex'>
            <Button variant='primaryPill' size='lg'>
              Ir a comprar
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          <div className='overflow-x-auto lg:col-span-3 bg-white rounded-lg shadow-level-3 border-0 p-4 md:p-6'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-hairline-light hover:bg-transparent'>
                  <TableHead className='text-black font-semibold h-12'>Producto</TableHead>
                  <TableHead className='text-center text-black font-semibold h-12'>Cantidad</TableHead>
                  <TableHead className='text-right text-black font-semibold h-12'>Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.slug} className='border-b border-hairline-light last:border-0 hover:bg-zinc-50/50 transition-colors duration-150'>
                    <TableCell className='py-4'>
                      <Link
                        href={`/product/${item.slug}`}
                        className='flex items-center gap-4 group'
                      >
                        <div className='overflow-hidden rounded-md border border-hairline-light bg-zinc-50 p-1 flex-shrink-0'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={60}
                            height={60}
                            className='object-contain rounded'
                          />
                        </div>
                        <span className='font-medium text-black group-hover:underline transition duration-150'>
                          {item.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className='py-4 text-center'>
                      <div className='flex items-center justify-center gap-3'>
                        <RemoveButton item={item} />
                        <span className='w-6 text-center font-semibold text-black'>{item.qty}</span>
                        <AddButton item={item} />
                      </div>
                    </TableCell>
                    <TableCell className='py-4 text-right font-semibold text-black'>
                      {formatCurrency(item.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='lg:col-span-1'>
            <Card className='shadow-level-3 border-0 bg-white rounded-lg overflow-hidden'>
              <CardContent className='p-6 flex flex-col gap-6'>
                <div className='space-y-2 border-b border-hairline-light pb-4'>
                  <p className='text-xs eyebrow-cap text-zinc-500 uppercase tracking-wider'>Resumen de compra</p>
                  <div className='text-lg font-medium text-black flex justify-between items-baseline'>
                    <span>Subtotal ({cart.items.reduce((a, c) => a + c.qty, 0)} items)</span>
                  </div>
                  <div className='text-2xl font-bold text-black pt-1'>
                    {formatCurrency(cart.itemsPrice)}
                  </div>
                </div>
                <Button
                  className='w-full'
                  variant='primaryPill'
                  size='lg'
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => router.push('/shipping-address'))
                  }
                >
                  {isPending ? (
                    <Loader className='w-4 h-4 animate-spin' />
                  ) : (
                    <>
                      Continuar Compra
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartTable;
