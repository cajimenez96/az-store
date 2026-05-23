import ProductForm from '@/components/admin/product-form';
import { getProductById } from '@/lib/actions/product.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';

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

  if (!product) return notFound();

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <h1 className='h2-bold'>Actualizar Producto</h1>

      <ProductForm type='Update' product={product} productId={product.id} categories={categories || []} brands={brands || []} userRole={role} />
    </div>
  );
};

export default AdminProductUpdatePage;
