import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts } from '@/lib/actions/product.actions';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/pagination';
import ProductRowActions from '@/components/admin/product-row-actions';
import { requireAdminOrSeller } from '@/lib/auth-guard';

const HEAD_CLASS =
  'text-xs font-semibold text-[#707072] uppercase tracking-wider h-10';

const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  const session = await requireAdminOrSeller();

  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  const products = await getAllProducts({
    query: searchText,
    page,
    category,
    includeInactive: true,
  });

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]'>
        <div className='flex items-center gap-3'>
          <div>
            <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Productos
            </h1>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
              Gestión de catálogo, variantes y stock
            </p>
          </div>
          {searchText && (
            <div className='flex items-center gap-2 bg-[#f5f5f5] px-3 py-1.5 rounded-full text-xs text-[#111111] font-medium'>
              <span>Filtro: <i>&quot;{searchText}&quot;</i></span>
              <Link href='/admin/products'>
                <Button variant='ghost' size='sm' className='h-5 px-1.5 text-[10px] uppercase font-semibold text-[#707072] hover:text-[#111111]'>
                  Quitar
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild className='rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10'>
          <Link href='/admin/products/create'>Crear Producto</Link>
        </Button>
      </div>

      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-[#e5e5e5] bg-[#f5f5f5] hover:bg-[#f5f5f5]'>
                <TableHead className={`${HEAD_CLASS} rounded-l-lg`}>PRODUCTO</TableHead>
                <TableHead className={HEAD_CLASS}>MARCA / TIPO</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right`}>PRECIO</TableHead>
                <TableHead className={HEAD_CLASS}>STOCK TOTAL</TableHead>
                <TableHead className={HEAD_CLASS}>ESTADO</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right rounded-r-lg`}>ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.map((product) => {
                const totalStock =
                  product.variants?.reduce((acc: number, v: { stock: number }) => acc + v.stock, 0) || 0;
                const mercadoPagoPrice = product.prices?.find((p) => p.paymentMethod === 'MERCADOPAGO')?.value;
                const cashPrice = product.prices?.find((p) => p.paymentMethod === 'CASH')?.value;
                const thumbnail = product.images?.[0];

                return (
                  <TableRow key={product.id} className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'>
                    <TableCell className='py-4'>
                      <div className='flex items-center gap-3 min-w-[220px]'>
                        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e5e5e5] bg-[#f5f5f5]'>
                          {thumbnail && (
                            <Image
                              src={thumbnail}
                              alt={product.name}
                              fill
                              sizes='48px'
                              className='object-cover'
                            />
                          )}
                        </div>
                        <span className='text-sm font-bold text-[#111111]'>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='py-4'>
                      <div className='text-sm font-semibold text-[#111111]'>{product.brand?.name || '—'}</div>
                      <div className='text-xs text-[#707072]'>{product.subCategory?.name || '—'}</div>
                    </TableCell>
                    <TableCell className='py-4 text-right tabular-nums'>
                      <div className='text-sm font-bold text-[#111111]'>
                        <span className='mr-1 text-xs font-semibold text-[#707072]'>Lista:</span>
                        {formatCurrency(mercadoPagoPrice ?? '0')}
                      </div>
                      {cashPrice !== undefined && (
                        <div className='text-xs font-semibold text-[#007d48]'>
                          Efectivo: {formatCurrency(cashPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='py-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          totalStock > 2
                            ? 'bg-[#e6f4ec] text-[#007d48]'
                            : 'bg-[#fef3c7] text-[#d97706]'
                        }`}
                      >
                        {totalStock} u.
                      </span>
                    </TableCell>
                    <TableCell className='py-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          product.isActive
                            ? 'bg-[#e6f4ec] text-[#007d48]'
                            : 'bg-[#f0f0f0] text-[#707072]'
                        }`}
                      >
                        {product.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </TableCell>
                    <TableCell className='py-4'>
                      <ProductRowActions id={product.id} isActive={product.isActive} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {products.totalPages > 1 && (
          <div className='pt-6 border-t border-[#e5e5e5] mt-4'>
            <Pagination page={page} totalPages={products.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
