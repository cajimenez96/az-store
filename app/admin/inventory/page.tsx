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
  const session = await requireAdminOrSeller();

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
    sellerId: session?.user?.role === 'seller' ? session.user.id : undefined,
  });

  const categoriesResult = await getAllCategories();
  const brands = await getAllBrands();

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='h2-bold'>Inventario Detallado</h1>
      </div>

      <InventoryFilters 
        categories={categoriesResult.data || []} 
        brands={brands} 
        currentCategory={categorySlug}
        currentBrand={brandSlug}
        currentStock={stockFilter}
        currentQuery={searchText}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>VARIANTE ID</TableHead>
            <TableHead>PRODUCTO</TableHead>
            <TableHead>MARCA</TableHead>
            <TableHead>CATEGORÍA</TableHead>
            <TableHead>TALLE</TableHead>
            <TableHead className='text-right'>STOCK</TableHead>
            <TableHead className='w-[100px]'>ACCIÓN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No se encontraron variantes con estos filtros.
              </TableCell>
            </TableRow>
          ) : (
            inventory.data.map((variant: any) => (
              <TableRow key={variant.id}>
                <TableCell className="font-mono text-xs">{formatId(variant.id)}</TableCell>
                <TableCell className="font-medium">{variant.product.name}</TableCell>
                <TableCell>{variant.product.brand?.name || '-'}</TableCell>
                <TableCell>
                  {variant.product.category?.name}
                  {variant.product.subCategory && ` / ${variant.product.subCategory.name}`}
                </TableCell>
                <TableCell className="font-bold">{variant.size?.name || '-'}</TableCell>
                <TableCell className={`text-right font-bold ${variant.stock <= 2 ? 'text-red-600' : ''}`}>
                  {variant.stock}
                </TableCell>
                <TableCell>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/products/${variant.productId}`}>Ver Producto</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {inventory.totalPages > 1 && (
        <Pagination page={page} totalPages={inventory.totalPages} />
      )}
    </div>
  );
};

export default AdminInventoryPage;
