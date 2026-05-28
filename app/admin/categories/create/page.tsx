import { Metadata } from 'next';
import CategoryForm from '@/components/admin/category-form';
import { requireAdminOrSeller } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Crear Categoría',
};

export default async function CreateCategoryPage() {
  await requireAdminOrSeller();
  return (
    <>
      <h2 className="h2-bold mb-4">Crear Categoría</h2>
      <div className="my-8">
        <CategoryForm type="Create" />
      </div>
    </>
  );
}
