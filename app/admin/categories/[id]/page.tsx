import { Metadata } from 'next';
import CategoryForm from '@/components/admin/category-form';
import { getCategoryById } from '@/lib/actions/category.actions';
import { notFound } from 'next/navigation';
import SizeForm from '@/components/admin/size-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteSize } from '@/lib/actions/size.actions';

export const metadata: Metadata = {
  title: 'Editar Categoría',
};

export default async function UpdateCategoryPage(props: {
  params: Promise<{
    id: string;
  }>;
}) {
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
        
        {/* Formulario para agregar nuevo talle */}
        <SizeForm categoryId={category.id} />

        {/* Tabla de talles existentes */}
        <div className="overflow-x-auto mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TALLE</TableHead>
                <TableHead className="w-[100px]">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.sizes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No hay talles configurados para esta categoría.
                  </TableCell>
                </TableRow>
              ) : (
                category.sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell>{size.name}</TableCell>
                    <TableCell>
                      <DeleteDialog id={size.id} action={deleteSize} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
