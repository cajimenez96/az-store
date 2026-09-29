import Link from 'next/link';
import { getInventory } from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';
import { formatId } from '@/lib/utils';
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
import { requireAdminOrSeller } from '@/lib/auth-guard';
import InventoryFilters from './inventory-filters';

const AdminInventoryPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
    brand: string;
    stock: string;
  }>;
}) => {
  await requireAdminOrSeller();

  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const categorySlug = searchParams.category || 'all';
  const brandSlug = searchParams.brand || 'all';
  const stockFilter = searchParams.stock || 'all';

  const inventory = await getInventory({
    query: searchText,
    page,
    category: categorySlug,
    brand: brandSlug,
    stock: stockFilter,
  });

  const categoriesResult = await getAllCategories();
  const brands = await getAllBrands();

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='pb-4 border-b border-[#e5e5e5]'>
        <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
          Inventario Detallado
        </h1>
        <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
          Control de stock granular por variante, talle y marca
        </p>
      </div>

      <InventoryFilters 
        categories={categoriesResult.data || []} 
        brands={brands} 
        currentCategory={categorySlug}
        currentBrand={brandSlug}
        currentStock={stockFilter}
        currentQuery={searchText}
      />

      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>VARIANTE ID</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>PRODUCTO</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>MARCA</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>CATEGORÍA</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>TALLE</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>STOCK</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs font-semibold text-[#707072]">
                  No se encontraron variantes con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              inventory.data.map((variant: any) => (
                <TableRow key={variant.id} className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'>
                  <TableCell className="font-mono text-xs text-[#707072] py-4">{formatId(variant.id)}</TableCell>
                  <TableCell className="text-sm font-semibold text-[#111111] py-4">{variant.product.name}</TableCell>
                  <TableCell className="text-xs font-semibold text-[#707072] uppercase py-4">{variant.product.brand?.name || '—'}</TableCell>
                  <TableCell className="text-xs text-[#707072] py-4">
                    {variant.product.category?.name}
                    {variant.product.subCategory && ` / ${variant.product.subCategory.name}`}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-[#111111] py-4">{variant.size?.name || '—'}</TableCell>
                  <TableCell className={`text-right font-semibold text-sm py-4 tabular-nums ${variant.stock <= 2 ? 'text-[#d30005]' : 'text-[#007d48]'}`}>
                    {variant.stock} u.
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Button asChild variant='outline' size='sm' className='h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'>
                      <Link href={`/admin/products/${variant.productId}`}>Ver Producto</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {inventory.totalPages > 1 && (
          <div className='border-t border-[#e5e5e5] pt-6 mt-4'>
            <Pagination page={page} totalPages={inventory.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventoryPage;
