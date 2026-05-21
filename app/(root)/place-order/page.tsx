import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { ShippingAddress } from '@/types';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CheckoutSteps from '@/components/shared/checkout-steps';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';
import PlaceOrderForm from './place-order-form';

export const metadata: Metadata = {
  title: 'Confirmar Compra',
};

const PlaceOrderPage = async () => {
  const cart = await getMyCart();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  if (!cart || cart.items.length === 0) redirect('/cart');
  if (!user.address) redirect('/shipping-address');
  if (!user.paymentMethod) redirect('/payment-method');

  const userAddress = user.address as ShippingAddress;

  return (
    <div className='w-full max-w-7xl mx-auto px-4 py-8 bg-canvas-cream rounded-xl'>
      <CheckoutSteps current={3} />
      
      <h1 className='font-display font-[330] text-3xl md:text-4xl text-black font-ss03 mb-8 px-2'>
        Confirmar Compra
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card className='shadow-level-3 border-0 bg-white rounded-lg overflow-hidden'>
            <CardContent className='p-6 space-y-4'>
              <div className='flex justify-between items-center border-b border-hairline-light pb-2 mb-2'>
                <h2 className='font-display font-[330] text-xl text-black'>Dirección de Envío</h2>
                <Link href='/shipping-address'>
                  <Button variant='outlineOnLight' size='sm'>Editar</Button>
                </Link>
              </div>
              <div className='text-zinc-800 text-sm space-y-1 font-medium'>
                <p className='font-bold text-black'>{userAddress.fullName}</p>
                <p>
                  {userAddress.streetAddress}, {userAddress.city}
                </p>
                <p>
                  {userAddress.postalCode}, {userAddress.country}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-level-3 border-0 bg-white rounded-lg overflow-hidden'>
            <CardContent className='p-6 space-y-4'>
              <div className='flex justify-between items-center border-b border-hairline-light pb-2 mb-2'>
                <h2 className='font-display font-[330] text-xl text-black'>Método de Pago</h2>
                <Link href='/payment-method'>
                  <Button variant='outlineOnLight' size='sm'>Editar</Button>
                </Link>
              </div>
              <p className='text-zinc-800 text-sm font-medium'>{user.paymentMethod}</p>
            </CardContent>
          </Card>

          <Card className='shadow-level-3 border-0 bg-white rounded-lg overflow-hidden'>
            <CardContent className='p-6 space-y-4'>
              <h2 className='font-display font-[330] text-xl text-black border-b border-hairline-light pb-4 mb-2'>
                Productos del Pedido
              </h2>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-hairline-light hover:bg-transparent'>
                      <TableHead className='text-black font-semibold'>Producto</TableHead>
                      <TableHead className='text-center text-black font-semibold'>Cantidad</TableHead>
                      <TableHead className='text-right text-black font-semibold'>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.slug} className='border-b border-hairline-light last:border-0 hover:bg-zinc-50/50 transition-colors duration-150'>
                        <TableCell className='py-3'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 group'
                          >
                            <div className='overflow-hidden rounded-md border border-hairline-light bg-zinc-50 p-1 flex-shrink-0'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={50}
                                height={50}
                                className='object-contain rounded'
                              />
                            </div>
                            <span className='font-medium text-black group-hover:underline transition duration-150'>
                              {item.name}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className='py-3 text-center font-semibold text-black'>
                          {item.qty}
                        </TableCell>
                        <TableCell className='py-3 text-right font-semibold text-black'>
                          {formatCurrency(item.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1'>
          <Card className='shadow-level-3 border-0 bg-white rounded-lg overflow-hidden sticky top-6'>
            <CardContent className='p-6 flex flex-col gap-5'>
              <h2 className='font-display font-[330] text-xl text-black border-b border-hairline-light pb-4 mb-2'>
                Resumen del Pedido
              </h2>
              <div className='space-y-3 text-sm font-medium text-zinc-600'>
                <div className='flex justify-between'>
                  <span>Productos</span>
                  <span className='text-black'>{formatCurrency(cart.itemsPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Impuestos</span>
                  <span className='text-black'>{formatCurrency(cart.taxPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Envío</span>
                  <span className='text-black'>{formatCurrency(cart.shippingPrice)}</span>
                </div>
                <div className='flex justify-between border-t border-hairline-light pt-4 text-base font-semibold text-black'>
                  <span>Total</span>
                  <span className='text-lg font-bold'>{formatCurrency(cart.totalPrice)}</span>
                </div>
              </div>
              <div className='pt-2'>
                <PlaceOrderForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderPage;
