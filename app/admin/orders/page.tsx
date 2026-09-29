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
import OrderFilters from './order-filters';

export const metadata: Metadata = {
  title: 'Pedidos (Admin)',
};

const AdminOrdersPage = async (props: {
  searchParams: Promise<{ page: string; query: string; status: string; paymentMethod: string }>;
}) => {
  const { page = '1', query: searchText = '', status = '', paymentMethod = '' } = await props.searchParams;

  await requireAdminOrSeller();

  const orders = await getAllOrders({
    page: Number(page),
    query: searchText,
    status,
    paymentMethod,
  });

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='pb-4 border-b border-[#e5e5e5]'>
        <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
          Pedidos
        </h1>
        <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
          Seguimiento de compras, estados de pago y despachos
        </p>
      </div>

      <OrderFilters
        currentQuery={searchText}
        currentStatus={status}
        currentPaymentMethod={paymentMethod}
      />

      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>ID</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>Fecha</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>Comprador</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>Total</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>Pagado</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>Entregado</TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow
                  key={order.id}
                  className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                >
                  <TableCell className='text-xs text-[#707072] py-4 font-mono'>
                    {formatId(order.id)}
                  </TableCell>
                  <TableCell className='text-xs text-[#707072] py-4 tabular-nums whitespace-nowrap'>
                    {formatDateTime(order.createdAt).dateTime}
                  </TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] py-4'>
                    {order.user.name}
                  </TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] py-4 text-right tabular-nums'>
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  <TableCell className='py-4 text-center'>
                    {order.isPaid && order.paidAt ? (
                      <span className='inline-flex items-center gap-1 text-xs font-semibold text-[#007d48]'>
                        <CheckCircle2 className='w-3.5 h-3.5' />
                        {formatDateTime(order.paidAt).dateOnly}
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 text-xs font-semibold text-[#d97706]'>
                        <XCircle className='w-3.5 h-3.5' />
                        Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='py-4 text-center'>
                    {order.isDelivered && order.deliveredAt ? (
                      <span className='inline-flex items-center gap-1 text-xs font-semibold text-[#111111]'>
                        <Package className='w-3.5 h-3.5' />
                        {formatDateTime(order.deliveredAt).dateOnly}
                      </span>
                    ) : (
                      <span className='text-xs text-[#707072]'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='py-4 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        asChild
                        variant='outline'
                        size='sm'
                        className='h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'
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
          <div className='border-t border-[#e5e5e5] pt-6 mt-4'>
            <Pagination page={Number(page) || 1} totalPages={orders?.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
