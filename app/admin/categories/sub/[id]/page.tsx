import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllCategories } from '@/lib/actions/category.actions';
import { prisma } from '@/db/prisma';
import SubCategoryForm from '@/components/admin/sub-category-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Editar Sub-categoría',
};

export default async function EditSubCategoryPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;

  const subCategory = await prisma.subCategory.findUnique({ where: { id } });
  if (!subCategory) notFound();

  const { data: categories = [] } = await getAllCategories();

  return (
    <>
      <h2 className="h2-bold mb-4">Editar Sub-categoría</h2>
      <div className="my-8">
        <SubCategoryForm
          type="Update"
          subCategory={subCategory}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </>
  );
}
