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
    <>
      <h2 className='h2-bold'>Crear Producto</h2>
      <div className='my-8'>
        <ProductForm
          type='Create'
          categories={categories || []}
          brands={brands || []}
          mpSurchargePercent={mpSurchargePercent}
        />
      </div>
    </>
  );
};

export default CreateProductPage;
