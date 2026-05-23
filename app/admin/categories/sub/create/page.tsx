import { Metadata } from 'next';
import { getAllCategories } from '@/lib/actions/category.actions';
import SubCategoryForm from '@/components/admin/sub-category-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Crear Sub-categoría',
};

export default async function CreateSubCategoryPage(props: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  await requireAdmin();
  const { categoryId } = await props.searchParams;
  const { data: categories = [] } = await getAllCategories();

  return (
    <>
      <h2 className="h2-bold mb-4">Crear Sub-categoría</h2>
      <div className="my-8">
        <SubCategoryForm
          type="Create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          defaultCategoryId={categoryId}
        />
      </div>
    </>
  );
}
