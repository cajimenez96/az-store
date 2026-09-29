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
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { DEFAULT_CATEGORY_ID } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Admin Categorías',
};

export default async function AdminCategoriesPage() {
  await requireAdminOrSeller();
  const { data: categories, success } = await getAllCategories();

  if (!success || !categories) {
    return <div>Error al cargar las categorías.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display">Categorías y Sub-categorías</h1>
          <p className="text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1">Estructura taxonómica del catálogo</p>
        </div>
        <Button asChild className="rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10">
          <Link href="/admin/categories/create">+ Categoría</Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e5e5e5] hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">CATEGORÍA</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">SLUG</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">PRODUCTOS</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">SUB-CATEGORÍAS</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right">ACCIONES</TableHead>
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
                  <TableRow className="border-b border-[#e5e5e5] hover:bg-[#fafafa] transition-colors">
                    <TableCell className="font-semibold text-sm text-[#111111] py-4">{category.name}</TableCell>
                    <TableCell className="text-xs text-[#707072] font-mono py-4">{category.slug}</TableCell>
                    <TableCell className="text-sm font-semibold text-[#111111] py-4 tabular-nums">{productCount}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {category.subCategories.length === 0 ? (
                          <span className="text-xs text-[#707072]">Sin sub-categorías</span>
                        ) : (
                          category.subCategories.map((sub) => (
                            <Badge key={sub.id} variant="outline" className="border-[#e5e5e5] text-[#111111] rounded-full text-[11px] font-semibold px-2.5 py-0.5">
                              {sub.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDefault ? (
                          <Badge variant="secondary" className="rounded-full text-xs">Predeterminada</Badge>
                        ) : (
                          <>
                            <Button asChild variant="outline" size="sm" className="h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors">
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
                    <TableRow key={sub.id} className="border-b border-[#f0f0f0] bg-[#fafafa]/50 hover:bg-[#f5f5f5]">
                      <TableCell className="pl-8 text-xs font-medium text-[#707072] py-2.5">
                        └ {sub.name}
                      </TableCell>
                      <TableCell className="text-xs text-[#707072] font-mono py-2.5">{sub.slug}</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="py-2.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="h-7 px-3 text-xs font-semibold uppercase tracking-wider rounded-full text-[#707072] hover:text-[#111111] hover:bg-white">
                            <Link href={`/admin/categories/sub/${sub.id}`}>Editar</Link>
                          </Button>
                          <DeleteDialog id={sub.id} action={deleteSubCategory} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow key={`${category.id}-add`} className="border-b border-[#e5e5e5]">
                    <TableCell colSpan={5} className="py-2 pl-8">
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-[#707072] hover:text-[#111111]">
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
