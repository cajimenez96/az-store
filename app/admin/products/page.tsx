import Link from 'next/link';
import { getAllProducts, deleteProduct } from '@/lib/actions/product.actions';
import { formatCurrency, formatId } from '@/lib/utils';
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
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdminOrSeller } from '@/lib/auth-guard';

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
        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>ID</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>NOMBRE</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>PRECIO (BASE)</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>CATEGORÍA</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>STOCK TOTAL</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>RATING</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.data.map((product) => {
              const totalStock = product.variants?.reduce((acc: number, v: { stock: number }) => acc + v.stock, 0) || 0;
              return (
                <TableRow key={product.id} className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'>
                  <TableCell className='text-xs font-mono text-[#707072] py-4'>{formatId(product.id)}</TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] py-4'>{product.name}</TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] text-right py-4 tabular-nums'>
                    {formatCurrency(
                      product.prices?.find((p) => p.paymentMethod === 'CASH')?.value ?? '0',
                    )}
                  </TableCell>
                  <TableCell className='text-xs font-semibold text-[#707072] uppercase py-4'>{product.category?.name || '—'}</TableCell>
                  <TableCell className='text-sm py-4'>
                    <span className={totalStock > 2 ? 'text-[#007d48] font-semibold' : 'text-[#d97706] font-semibold'}>
                      {totalStock} u.
                    </span>
                  </TableCell>
                  <TableCell className='text-xs text-[#707072] py-4 tabular-nums'>{product.rating} ★</TableCell>
                  <TableCell className='py-4 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button asChild variant='outline' size='sm' className='h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'>
                        <Link href={`/admin/products/${product.id}`}>Editar</Link>
                      </Button>
                      <DeleteDialog id={product.id} action={deleteProduct} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
