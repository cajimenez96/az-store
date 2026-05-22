import ProductForm from '@/components/admin/product-form';
import { getProductById } from '@/lib/actions/product.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';

export const metadata: Metadata = {
  title: 'Actualizar Producto',
};

const AdminProductUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await requireAdmin();

  const { id } = await props.params;

  const product = await getProductById(id);
  const { data: categories } = await getAllCategories();

  if (!product) return notFound();

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <h1 className='h2-bold'>Actualizar Producto</h1>

      <ProductForm type='Update' product={product} productId={product.id} categories={categories || []} />
    </div>
  );
};

export default AdminProductUpdatePage;
