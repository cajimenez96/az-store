import { Metadata } from 'next';
import CategoryForm from '@/components/admin/category-form';

export const metadata: Metadata = {
  title: 'Crear Categoría',
};

export default function CreateCategoryPage() {
  return (
    <>
      <h2 className="h2-bold mb-4">Crear Categoría</h2>
      <div className="my-8">
        <CategoryForm type="Create" />
      </div>
    </>
  );
}
