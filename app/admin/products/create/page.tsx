import { Metadata } from 'next';
import ProductForm from '@/components/admin/product-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';

export const metadata: Metadata = {
  title: 'Crear Producto',
};

const CreateProductPage = async () => {
  await requireAdmin();
  const { data: categories } = await getAllCategories();

  return (
    <>
      <h2 className='h2-bold'>Crear Producto</h2>
      <div className='my-8'>
        <ProductForm type='Create' categories={categories || []} />
      </div>
    </>
  );
};

export default CreateProductPage;
