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
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdminOrSeller } from '@/lib/auth-guard';

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Marcas</h1>
        <Button asChild variant="default">
          <Link href="/admin/brands/create">+ Marca</Link>
        </Button>
      </div>

      {/* Brands table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MARCA</TableHead>
              <TableHead>SLUG</TableHead>
              <TableHead className="w-[180px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id} className="bg-zinc-50">
                <TableCell className="font-semibold">{brand.name}</TableCell>
                <TableCell className="text-sm text-zinc-500">{brand.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/brands/${brand.id}`}>Editar</Link>
                    </Button>
                    <DeleteDialog id={brand.id} action={deleteBrand} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {brands.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-zinc-500">
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
