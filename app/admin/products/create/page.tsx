import { Metadata } from 'next';
import ProductForm from '@/components/admin/product-form';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';

export const metadata: Metadata = {
  title: 'Crear Producto',
};

const CreateProductPage = async () => {
  await requireAdminOrSeller();
  const { data: categories } = await getAllCategories();
  const brands = await getAllBrands();

  return (
    <>
      <h2 className='h2-bold'>Crear Producto</h2>
      <div className='my-8'>
        <ProductForm type='Create' categories={categories || []} brands={brands || []} />
      </div>
    </>
  );
};

export default CreateProductPage;
