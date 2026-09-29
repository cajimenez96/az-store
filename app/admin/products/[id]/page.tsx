import ProductForm from '@/components/admin/product-form';
import { getProductById } from '@/lib/actions/product.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';
import { getMpSurchargePercent } from '@/lib/actions/price.actions';

export const metadata: Metadata = {
  title: 'Actualizar Producto',
};

const AdminProductUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const session = await requireAdminOrSeller();
  const role = session?.user?.role;

  const { id } = await props.params;

  const product = await getProductById(id);
  const { data: categories } = await getAllCategories();
  const brands = await getAllBrands();
  const mpSurchargePercent = await getMpSurchargePercent();

  if (!product) return notFound();

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <div className='pb-4 border-b border-[#e5e5e5]'>
        <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
          Actualizar Producto
        </h1>
        <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
          Modificación de datos, precios y variantes
        </p>
      </div>

      <ProductForm
        type='Update'
        product={product}
        productId={product.id}
        categories={categories || []}
        brands={brands || []}
        userRole={role}
        mpSurchargePercent={mpSurchargePercent}
      />
    </div>
  );
};

export default AdminProductUpdatePage;
