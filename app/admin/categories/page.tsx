import React from 'react';
import { Metadata } from 'next';
import {
  getAllCategories,
  deleteCategory,
  deleteSubCategory,
} from '@/lib/actions/category.actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdmin } from '@/lib/auth-guard';
import { DEFAULT_CATEGORY_ID } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Admin Categorías',
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const { data: categories, success } = await getAllCategories();

  if (!success || !categories) {
    return <div>Error al cargar las categorías.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Categorías y Sub-categorías</h1>
        <Button asChild variant="default">
          <Link href="/admin/categories/create">+ Categoría</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CATEGORÍA</TableHead>
              <TableHead>SLUG</TableHead>
              <TableHead>PRODUCTOS</TableHead>
              <TableHead>SUB-CATEGORÍAS</TableHead>
              <TableHead className="w-[180px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const isDefault = category.id === DEFAULT_CATEGORY_ID;
              const productCount = category._count.products;
              const warningMessage =
                productCount > 0
                  ? `Esta categoría tiene ${productCount} producto${productCount !== 1 ? 's' : ''}. Serán reasignados a "Sin categoría".`
                  : undefined;

              return (
                <React.Fragment key={category.id}>
                  <TableRow className="bg-zinc-50">
                    <TableCell className="font-semibold">{category.name}</TableCell>
                    <TableCell className="text-sm text-zinc-500">{category.slug}</TableCell>
                    <TableCell className="text-sm text-zinc-500">{productCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.subCategories.length === 0 ? (
                          <span className="text-xs text-zinc-400">Sin sub-categorías</span>
                        ) : (
                          category.subCategories.map((sub) => (
                            <Badge key={sub.id} variant="secondary" className="text-xs">
                              {sub.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isDefault ? (
                          <Badge variant="secondary">Predeterminada</Badge>
                        ) : (
                          <>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/categories/${category.id}`}>Editar</Link>
                            </Button>
                            <DeleteDialog
                              id={category.id}
                              action={deleteCategory}
                              warningMessage={warningMessage}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {category.subCategories.map((sub) => (
                    <TableRow key={sub.id} className="border-t-0">
                      <TableCell className="pl-10 text-sm text-zinc-500">
                        └ {sub.name}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">{sub.slug}</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/categories/sub/${sub.id}`}>Editar</Link>
                          </Button>
                          <DeleteDialog id={sub.id} action={deleteSubCategory} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow key={`${category.id}-add`} className="border-t-0">
                    <TableCell colSpan={5} className="py-1 pl-10">
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-zinc-400 hover:text-black">
                        <Link href={`/admin/categories/sub/create?categoryId=${category.id}`}>
                          + Agregar sub-categoría a &quot;{category.name}&quot;
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
