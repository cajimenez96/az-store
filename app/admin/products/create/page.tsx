import { Metadata } from 'next';
import ProductForm from '@/components/admin/product-form';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';
import { getMpSurchargePercent } from '@/lib/actions/price.actions';

export const metadata: Metadata = {
  title: 'Crear Producto',
};

const CreateProductPage = async () => {
  await requireAdminOrSeller();
  const { data: categories } = await getAllCategories();
  const brands = await getAllBrands();
  const mpSurchargePercent = await getMpSurchargePercent();

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <div className='pb-4 border-b border-[#e5e5e5]'>
        <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
          Crear Producto
        </h1>
        <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
          Nuevo artículo para catálogo online y POS
        </p>
      </div>
      <div>
        <ProductForm
          type='Create'
          categories={categories || []}
          brands={brands || []}
          mpSurchargePercent={mpSurchargePercent}
        />
      </div>
    </div>
  );
};

export default CreateProductPage;
