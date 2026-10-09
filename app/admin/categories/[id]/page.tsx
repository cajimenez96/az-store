import { Metadata } from 'next';
import CategoryForm from '@/components/admin/category-form';
import { getCategoryById } from '@/lib/actions/category.actions';
import { notFound } from 'next/navigation';
import SizeForm from '@/components/admin/size-form';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteSize } from '@/lib/actions/size.actions';
import { requireAdminOrSeller } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Editar Categoría',
};

const UpdateCategoryPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const session = await requireAdminOrSeller();
  const canManageSizes = session.user.role === 'admin';
  const { id } = await props.params;
  const { data: category, success } = await getCategoryById(id);

  if (!success || !category) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="h2-bold mb-4">Editar Categoría</h2>
        <CategoryForm type="Update" category={category} />
      </div>

      <div className="border-t pt-8 space-y-4">
        <h2 className="h2-bold mb-4">Talles de esta Categoría</h2>
        
        {canManageSizes ? (
          <SizeForm categoryId={category.id} />
        ) : (
          <p className="text-sm text-nike-mute">
            Solo un administrador puede agregar o eliminar talles.
          </p>
        )}

        {category.sizes.length === 0 ? (
          <div className="rounded-nike-md bg-nike-soft-cloud px-4 py-6 text-center text-sm text-nike-mute">
            No hay talles configurados para esta categoría.
          </div>
        ) : (
          <ul className="divide-y divide-nike-hairline-soft overflow-hidden rounded-nike-md border border-nike-hairline-soft bg-white">
            {category.sizes.map((size) => (
              <li
                key={size.id}
                className="flex min-h-11 items-center justify-between gap-3 px-4 py-1 text-nike-ink"
              >
                <span className="font-medium">{size.name}</span>
                {canManageSizes && (
                  <DeleteDialog id={size.id} action={deleteSize} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UpdateCategoryPage;
