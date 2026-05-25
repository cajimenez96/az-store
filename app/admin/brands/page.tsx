import React from 'react';
import { Metadata } from 'next';
import {
  getAllBrands,
  deleteBrand,
} from '@/lib/actions/brand.actions';
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
import { DEFAULT_BRAND_ID } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Admin Marcas',
};

export default async function AdminBrandsPage() {
  await requireAdminOrSeller();
  const brands = await getAllBrands();

  if (!brands) {
    return <div>Error al cargar las marcas.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Marcas</h1>
        <Button asChild variant="default">
          <Link href="/admin/brands/create">+ Marca</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MARCA</TableHead>
              <TableHead>SLUG</TableHead>
              <TableHead>PRODUCTOS</TableHead>
              <TableHead className="w-[180px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => {
              const isDefault = brand.id === DEFAULT_BRAND_ID;
              const productCount = brand._count.products;
              const warningMessage =
                productCount > 0
                  ? `Esta marca tiene ${productCount} producto${productCount !== 1 ? 's' : ''}. Serán reasignados a "Sin marca".`
                  : undefined;

              return (
                <TableRow key={brand.id} className="bg-zinc-50">
                  <TableCell className="font-semibold">{brand.name}</TableCell>
                  <TableCell className="text-sm text-zinc-500">{brand.slug}</TableCell>
                  <TableCell className="text-sm text-zinc-500">{productCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isDefault ? (
                        <Badge variant="secondary">Predeterminada</Badge>
                      ) : (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/brands/${brand.id}`}>Editar</Link>
                          </Button>
                          <DeleteDialog
                            id={brand.id}
                            action={deleteBrand}
                            warningMessage={warningMessage}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {brands.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-zinc-500">
                  No hay marcas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
