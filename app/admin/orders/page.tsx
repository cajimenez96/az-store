import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteOrder, getAllOrders } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { CheckCircle2, XCircle, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pedidos (Admin)',
};

const AdminOrdersPage = async (props: {
  searchParams: Promise<{ page: string; query: string }>;
}) => {
  const { page = '1', query: searchText } = await props.searchParams;

  await requireAdminOrSeller();

  const orders = await getAllOrders({
    page: Number(page),
    query: searchText,
  });

  return (
    <div className='space-y-5'>
      <div className='flex items-center gap-3'>
        <h1 className='az-heading-lg text-az-ink-deep'>Pedidos</h1>
        {searchText && (
          <div className='flex items-center gap-2 az-body-sm text-az-charcoal'>
            Filtrado por <i>&quot;{searchText}&quot;</i>
            <Link href='/admin/orders'>
              <Button
                variant='outline'
                size='sm'
                className='h-7 az-caption-bold rounded-az-full border-az-hairline-soft text-az-ink hover:bg-az-ink-deep hover:text-white hover:border-az-ink-deep transition-colors'
              >
                Quitar Filtro
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-az-hairline-soft hover:bg-transparent bg-az-surface-soft/50'>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10 pl-5'>ID</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10'>Fecha</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10'>Comprador</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10 text-right'>Total</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10 text-center'>Pagado</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10 text-center'>Entregado</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-10'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow
                  key={order.id}
                  className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors'
                >
                  <TableCell className='az-caption text-az-steel py-3 pl-5 font-mono'>
                    {formatId(order.id)}
                  </TableCell>
                  <TableCell className='az-body-sm text-az-charcoal py-3 tabular-nums whitespace-nowrap'>
                    {formatDateTime(order.createdAt).dateTime}
                  </TableCell>
                  <TableCell className='az-body-sm-bold text-az-ink-deep py-3'>
                    {order.user.name}
                  </TableCell>
                  <TableCell className='az-body-sm-bold text-az-ink-deep py-3 text-right tabular-nums'>
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  <TableCell className='py-3 text-center'>
                    {order.isPaid && order.paidAt ? (
                      <span className='inline-flex items-center gap-1 az-caption text-az-success'>
                        <CheckCircle2 className='w-3.5 h-3.5' />
                        {formatDateTime(order.paidAt).dateOnly}
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 az-caption text-az-stone'>
                        <XCircle className='w-3.5 h-3.5' />
                        Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='py-3 text-center'>
                    {order.isDelivered && order.deliveredAt ? (
                      <span className='inline-flex items-center gap-1 az-caption text-az-primary'>
                        <Package className='w-3.5 h-3.5' />
                        {formatDateTime(order.deliveredAt).dateOnly}
                      </span>
                    ) : (
                      <span className='az-caption text-az-stone'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='py-3 pr-5'>
                    <div className='flex items-center gap-2'>
                      <Button
                        asChild
                        variant='outline'
                        size='sm'
                        className='h-7 az-caption-bold rounded-az-full border-az-hairline-soft text-az-ink hover:bg-az-ink-deep hover:text-white hover:border-az-ink-deep transition-colors'
                      >
                        <Link href={`/order/${order.id}`}>Detalles</Link>
                      </Button>
                      <DeleteDialog id={order.id} action={deleteOrder} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {orders.totalPages > 1 && (
          <div className='border-t border-az-hairline-soft p-4'>
            <Pagination page={Number(page) || 1} totalPages={orders?.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
