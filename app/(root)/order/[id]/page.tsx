import { Metadata } from 'next';
import { getOrderById } from '@/lib/actions/order.actions';
import { getBankSettings } from '@/lib/actions/settings.actions';
import { notFound, redirect } from 'next/navigation';
import OrderDetailsTable from './order-details-table';
import { ShippingAddress } from '@/types';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Detalles del Pedido',
};

const OrderDetailsPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const session = await auth();

  // Redirect the user if they don't own the order
  if (order.userId !== session?.user.id && session?.user.role !== 'admin' && session?.user.role !== 'seller') {
    return redirect('/unauthorized');
  }

  const bankInfo = await getBankSettings();

  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      isAdmin={session?.user?.role === 'admin' || false}
      isSeller={session?.user?.role === 'seller' || false}
      bankInfo={bankInfo}
    />
  );
};

export default OrderDetailsPage;
